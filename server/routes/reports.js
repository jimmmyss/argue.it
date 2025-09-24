const express = require('express');
const { verifyToken, checkBanned } = require('../middleware/auth');
const { validate, reportSchema } = require('../middleware/validation');
const { getFirestore } = require('../config/firebase');

const router = express.Router();

/**
 * POST /api/report
 * Submit a report
 */
router.post('/', verifyToken, checkBanned, validate(reportSchema), async (req, res) => {
  try {
    const { type, targetId, reason, description } = req.body;
    const { uid } = req.user;
    
    const db = getFirestore();
    
    // Check if target exists
    if (type === 'post') {
      const postDoc = await db.collection('posts').doc(targetId).get();
      if (!postDoc.exists || postDoc.data().isDeleted) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Post not found'
        });
      }
    } else if (type === 'user') {
      const userDoc = await db.collection('users').doc(targetId).get();
      if (!userDoc.exists) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found'
        });
      }
    }

    // Check if user has already reported this target
    const existingReportSnapshot = await db.collection('reports')
      .where('reporterUid', '==', uid)
      .where('targetId', '==', targetId)
      .where('type', '==', type)
      .where('status', '==', 'pending')
      .get();

    if (!existingReportSnapshot.empty) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'You have already reported this item'
      });
    }

    // Create report
    const report = {
      type,
      targetId,
      reason,
      description: description || '',
      reporterUid: uid,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('reports').add(report);

    // Update report count on the target
    if (type === 'post') {
      const postRef = db.collection('posts').doc(targetId);
      await postRef.update({
        reportCount: db.FieldValue.increment(1),
        updatedAt: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      reportId: docRef.id
    });
  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to submit report'
    });
  }
});

/**
 * GET /api/report/my-reports
 * Get current user's reports
 */
router.get('/my-reports', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { limit = 20, pageToken } = req.query;
    
    const db = getFirestore();
    
    let query = db.collection('reports')
      .where('reporterUid', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit));

    if (pageToken) {
      const lastDoc = await db.collection('reports').doc(pageToken).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const snapshot = await query.get();
    const reports = [];

    for (const doc of snapshot.docs) {
      const reportData = doc.data();
      
      // Get target information
      let targetInfo = null;
      if (reportData.type === 'post') {
        const postDoc = await db.collection('posts').doc(reportData.targetId).get();
        if (postDoc.exists) {
          const postData = postDoc.data();
          targetInfo = {
            title: postData.title,
            isDeleted: postData.isDeleted
          };
        }
      } else if (reportData.type === 'user') {
        const userDoc = await db.collection('users').doc(reportData.targetId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          targetInfo = {
            displayName: userData.displayName,
            email: userData.email,
            isBanned: userData.isBanned
          };
        }
      }

      reports.push({
        id: doc.id,
        type: reportData.type,
        targetId: reportData.targetId,
        reason: reportData.reason,
        description: reportData.description,
        status: reportData.status,
        createdAt: reportData.createdAt.toDate(),
        targetInfo
      });
    }

    res.json({
      success: true,
      reports,
      hasMore: snapshot.docs.length === parseInt(limit),
      nextPageToken: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null
    });
  } catch (error) {
    console.error('Get my reports error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get reports'
    });
  }
});

/**
 * DELETE /api/report/:id
 * Cancel a pending report (reporter only)
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.user;
    
    const db = getFirestore();
    const reportRef = db.collection('reports').doc(id);
    const reportDoc = await reportRef.get();
    
    if (!reportDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Report not found'
      });
    }

    const reportData = reportDoc.data();
    
    // Check if user owns this report
    if (reportData.reporterUid !== uid) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only cancel your own reports'
      });
    }

    // Check if report is still pending
    if (reportData.status !== 'pending') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Can only cancel pending reports'
      });
    }

    // Delete the report
    await reportRef.delete();

    // Decrement report count on target if it's a post
    if (reportData.type === 'post') {
      const postRef = db.collection('posts').doc(reportData.targetId);
      const postDoc = await postRef.get();
      
      if (postDoc.exists) {
        await postRef.update({
          reportCount: Math.max(0, (postDoc.data().reportCount || 1) - 1),
          updatedAt: new Date()
        });
      }
    }

    res.json({
      success: true,
      message: 'Report cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel report error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to cancel report'
    });
  }
});

/**
 * GET /api/report/reasons
 * Get available report reasons
 */
router.get('/reasons', (req, res) => {
  const reasons = [
    {
      value: 'spam',
      label: 'Spam',
      description: 'Repetitive, unwanted, or promotional content'
    },
    {
      value: 'harassment',
      label: 'Harassment',
      description: 'Bullying, threats, or targeted harassment'
    },
    {
      value: 'inappropriate',
      label: 'Inappropriate Content',
      description: 'Offensive, explicit, or inappropriate material'
    },
    {
      value: 'misinformation',
      label: 'Misinformation',
      description: 'False or misleading information'
    },
    {
      value: 'other',
      label: 'Other',
      description: 'Other violations not covered above'
    }
  ];

  res.json({
    success: true,
    reasons
  });
});

module.exports = router;
