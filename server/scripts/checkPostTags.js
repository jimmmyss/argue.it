const { initializeFirebase, getFirestore } = require('../config/firebase');

async function checkPostTags() {
  try {
    console.log('🔍 Checking post tags...');
    
    // Initialize Firebase
    initializeFirebase();
    const db = getFirestore();
    
    // Get all posts
    const postsSnapshot = await db.collection('posts').get();
    
    if (postsSnapshot.empty) {
      console.log('No posts found.');
      return;
    }
    
    console.log(`Found ${postsSnapshot.size} posts:`);
    console.log('');
    
    postsSnapshot.forEach((doc, index) => {
      const postData = doc.data();
      const tags = postData.tags || [];
      const title = postData.title || 'Untitled';
      
      console.log(`${index + 1}. "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}"`);
      console.log(`   Tags: [${tags.join(', ')}] (${tags.length} tag${tags.length !== 1 ? 's' : ''})`);
      console.log('');
    });
    
    // Summary
    const tagCounts = {};
    let multipleTagCount = 0;
    let noTagCount = 0;
    
    postsSnapshot.forEach((doc) => {
      const postData = doc.data();
      const tags = postData.tags || [];
      
      if (tags.length === 0) noTagCount++;
      if (tags.length > 1) multipleTagCount++;
      
      tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    console.log('📊 Summary:');
    console.log(`- Total posts: ${postsSnapshot.size}`);
    console.log(`- Posts with no tags: ${noTagCount}`);
    console.log(`- Posts with multiple tags: ${multipleTagCount}`);
    console.log(`- Posts with single tag: ${postsSnapshot.size - noTagCount - multipleTagCount}`);
    console.log('');
    
    if (Object.keys(tagCounts).length > 0) {
      console.log('🏷️ Tag usage:');
      Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([tag, count]) => {
          console.log(`- ${tag}: ${count} post${count !== 1 ? 's' : ''}`);
        });
    }
    
  } catch (error) {
    console.error('❌ Error checking posts:', error);
    throw error;
  }
}

// Run the check if this script is executed directly
if (require.main === module) {
  checkPostTags()
    .then(() => {
      console.log('✅ Check completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkPostTags };


