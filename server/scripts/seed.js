const { initializeFirebase, getFirestore } = require('../config/firebase');
const categoryService = require('../services/categoryService');

// Sample data
const samplePosts = [
  {
    title: "Should remote work be the default for all office jobs?",
    body: "With technology advancing and work-life balance becoming more important, should companies make remote work the standard rather than the exception?",
    category: "Technology",
    tags: ["Career"],
    votes: { yes: 156, no: 89 }
  },
  {
    title: "Is social media doing more harm than good to society?",
    body: "Considering mental health impacts, misinformation spread, and social division, are the benefits of social media platforms outweighed by their negative effects?",
    category: "Society",
    tags: ["Media"],
    votes: { yes: 203, no: 134 }
  },
  {
    title: "Should college education be free for everyone?",
    body: "Many countries offer free higher education. Should this be a universal right, or should students continue to pay for their education?",
    category: "Society",
    tags: ["Education"],
    votes: { yes: 287, no: 198 }
  },
  {
    title: "Is artificial intelligence a threat to human employment?",
    body: "As AI becomes more sophisticated, will it replace human workers faster than new jobs can be created?",
    category: "Technology",
    tags: ["Career"],
    votes: { yes: 178, no: 156 }
  },
  {
    title: "Should voting be mandatory in democratic countries?",
    body: "Some countries require citizens to vote. Would mandatory voting lead to better democratic outcomes or just uninformed participation?",
    category: "Politics",
    tags: ["Politics"],
    votes: { yes: 145, no: 201 }
  },
  {
    title: "Is it ethical to eat meat in modern society?",
    body: "With plant-based alternatives and knowledge about animal welfare, is consuming meat still morally acceptable?",
    category: "Ethics",
    tags: ["Ethics"],
    votes: { yes: 167, no: 189 }
  },
  {
    title: "Should parents monitor their children's online activity?",
    body: "In an age of cyberbullying and online predators, should parents have full access to their children's digital communications?",
    category: "Society",
    tags: ["Internet"],
    votes: { yes: 234, no: 112 }
  },
  {
    title: "Is cryptocurrency the future of money?",
    body: "With volatility and environmental concerns, will cryptocurrencies eventually replace traditional currencies?",
    category: "Technology",
    tags: ["Economics"],
    votes: { yes: 198, no: 176 }
  },
  {
    title: "Should celebrities stay out of politics?",
    body: "Do celebrities have too much influence on political discourse, or is their platform a legitimate way to engage in democracy?",
    category: "Politics",
    tags: ["Media"],
    votes: { yes: 156, no: 143 }
  },
  {
    title: "Is online dating better than meeting people in person?",
    body: "Dating apps have changed how we meet partners. Are they more efficient than traditional methods, or do they harm genuine connections?",
    category: "Relationships",
    tags: ["Relationships"],
    votes: { yes: 134, no: 167 }
  },
  {
    title: "Should violent video games be banned for minors?",
    body: "Research on video game violence is mixed. Should there be stricter age restrictions on violent gaming content?",
    category: "Entertainment",
    tags: ["Gaming"],
    votes: { yes: 123, no: 189 }
  },
  {
    title: "Is working from home making us less productive?",
    body: "While some studies show increased productivity, others suggest distractions and isolation reduce work quality. What's the reality?",
    category: "Lifestyle",
    tags: ["Career"],
    votes: { yes: 145, no: 178 }
  },
  {
    title: "Should plastic bags be completely banned worldwide?",
    body: "Many places have banned single-use plastic bags. Should this be a global policy despite convenience and economic impacts?",
    category: "Society",
    tags: ["Environment"],
    votes: { yes: 267, no: 98 }
  },
  {
    title: "Is cancel culture going too far?",
    body: "Public accountability vs. mob mentality - has the practice of 'canceling' public figures crossed the line from justice to harassment?",
    category: "Society",
    tags: ["Law"],
    votes: { yes: 189, no: 156 }
  },
  {
    title: "Should tipping be eliminated in favor of higher wages?",
    body: "Many countries don't have tipping culture. Should restaurants pay living wages instead of relying on customer tips?",
    category: "Society",
    tags: ["Food"],
    votes: { yes: 201, no: 134 }
  },
  {
    title: "Is streaming killing the movie theater experience?",
    body: "With high-quality home entertainment systems and day-and-date streaming releases, are movie theaters becoming obsolete?",
    category: "Entertainment",
    tags: ["Film"],
    votes: { yes: 167, no: 145 }
  },
  {
    title: "Should social media platforms fact-check content?",
    body: "Balancing free speech with misinformation - should private companies be responsible for determining what's true or false?",
    category: "Technology",
    tags: ["Media"],
    votes: { yes: 178, no: 167 }
  },
  {
    title: "Is monogamy an outdated concept?",
    body: "With changing social norms and relationship structures, is traditional monogamy still the ideal relationship model?",
    category: "Relationships",
    tags: ["Relationships"],
    votes: { yes: 123, no: 201 }
  },
  {
    title: "Should athletes be allowed to compete while using performance-enhancing drugs?",
    body: "If everyone has access to the same enhancements, would it level the playing field or fundamentally change sports?",
    category: "Ethics",
    tags: ["Sports"],
    votes: { yes: 89, no: 234 }
  },
  {
    title: "Is universal basic income necessary for the future?",
    body: "As automation increases and job markets change, should governments provide basic income to all citizens regardless of employment?",
    category: "Politics",
    tags: ["Economics"],
    votes: { yes: 198, no: 167 }
  }
];

const sampleUsers = [
  {
    uid: 'user1',
    email: 'alice@example.com',
    displayName: 'Alice Johnson',
    role: 'user'
  },
  {
    uid: 'user2', 
    email: 'bob@example.com',
    displayName: 'Bob Smith',
    role: 'user'
  },
  {
    uid: 'user3',
    email: 'carol@example.com', 
    displayName: 'Carol Davis',
    role: 'user'
  },
  {
    uid: 'admin1',
    email: 'admin@example.com',
    displayName: 'Admin User',
    role: 'admin'
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Initialize Firebase
    initializeFirebase();
    const db = getFirestore();
    
    // 1. Initialize default categories
    console.log('📁 Creating categories...');
    await categoryService.initializeDefaultCategories();
    
    // Get categories for reference
    const categories = await categoryService.getAllCategories();
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });
    
    // 2. Create sample users
    console.log('👥 Creating sample users...');
    const batch1 = db.batch();
    
    for (const userData of sampleUsers) {
      const userRef = db.collection('users').doc(userData.uid);
      batch1.set(userRef, {
        ...userData,
        isBanned: false,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        updatedAt: new Date(),
        postCount: 0,
        voteCount: 0
      });
    }
    
    await batch1.commit();
    console.log(`✅ Created ${sampleUsers.length} users`);
    
    // 3. Create sample posts
    console.log('📝 Creating sample posts...');
    const postIds = [];
    
    for (let i = 0; i < samplePosts.length; i++) {
      const postData = samplePosts[i];
      const authorUid = sampleUsers[i % sampleUsers.length].uid;
      const categoryId = categoryMap[postData.category];
      
      if (!categoryId) {
        console.warn(`⚠️ Category not found: ${postData.category}`);
        continue;
      }
      
      const createdAt = new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000); // Random date within last 14 days
      
      const post = {
        title: postData.title,
        body: postData.body,
        categoryId,
        authorUid,
        tags: postData.tags,
        createdAt,
        updatedAt: createdAt,
        voteCount: postData.votes.yes + postData.votes.no,
        yesCount: postData.votes.yes,
        noCount: postData.votes.no,
        reportCount: 0,
        isDeleted: false
      };
      
      const docRef = await db.collection('posts').add(post);
      postIds.push({ id: docRef.id, ...postData.votes });
      
      // Update category post count
      await categoryService.updateCategoryPostCount(categoryId, true);
    }
    
    console.log(`✅ Created ${postIds.length} posts`);
    
    // 4. Create sample votes
    console.log('🗳️ Creating sample votes...');
    const voteBatch = db.batch();
    let voteCount = 0;
    
    for (const post of postIds) {
      // Create votes for this post
      const totalVotes = post.yes + post.no;
      const votersNeeded = Math.min(totalVotes, sampleUsers.length * 3); // Limit to avoid too many votes per user
      
      for (let v = 0; v < votersNeeded; v++) {
        const voterUid = sampleUsers[v % sampleUsers.length].uid;
        const voteValue = v < post.yes ? 'yes' : 'no';
        const voteId = `${post.id}_${voterUid}_${v}`; // Add index to avoid duplicates
        
        const voteRef = db.collection('votes').doc(voteId);
        voteBatch.set(voteRef, {
          postId: post.id,
          userUid: voterUid,
          vote: voteValue,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date within last 7 days
        });
        
        voteCount++;
        
        // Commit in batches of 500 (Firestore limit)
        if (voteCount % 500 === 0) {
          await voteBatch.commit();
          console.log(`📊 Created ${voteCount} votes so far...`);
        }
      }
    }
    
    // Commit remaining votes
    if (voteCount % 500 !== 0) {
      await voteBatch.commit();
    }
    
    console.log(`✅ Created ${voteCount} votes`);
    
    // 5. Create some sample reports
    console.log('🚨 Creating sample reports...');
    const reportBatch = db.batch();
    
    const sampleReports = [
      {
        type: 'post',
        targetId: postIds[0].id,
        reason: 'spam',
        description: 'This looks like spam content',
        reporterUid: 'user2'
      },
      {
        type: 'post', 
        targetId: postIds[1].id,
        reason: 'inappropriate',
        description: 'Inappropriate language used',
        reporterUid: 'user3'
      },
      {
        type: 'user',
        targetId: 'user1',
        reason: 'harassment',
        description: 'User has been harassing others',
        reporterUid: 'user2'
      }
    ];
    
    for (let i = 0; i < sampleReports.length; i++) {
      const reportRef = db.collection('reports').doc();
      reportBatch.set(reportRef, {
        ...sampleReports[i],
        status: 'pending',
        createdAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000), // Random date within last 3 days
        updatedAt: new Date()
      });
    }
    
    await reportBatch.commit();
    console.log(`✅ Created ${sampleReports.length} reports`);
    
    // 6. Update user post counts
    console.log('📊 Updating user statistics...');
    for (const user of sampleUsers) {
      const userPosts = await db.collection('posts')
        .where('authorUid', '==', user.uid)
        .where('isDeleted', '==', false)
        .get();
      
      const userVotes = await db.collection('votes')
        .where('userUid', '==', user.uid)
        .get();
      
      await db.collection('users').doc(user.uid).update({
        postCount: userPosts.size,
        voteCount: userVotes.size,
        updatedAt: new Date()
      });
    }
    
    console.log('✅ Updated user statistics');
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Users: ${sampleUsers.length}`);
    console.log(`   Posts: ${postIds.length}`);
    console.log(`   Votes: ${voteCount}`);
    console.log(`   Reports: ${sampleReports.length}`);
    
    console.log('\n🔑 Test Accounts:');
    console.log('   Regular Users: alice@example.com, bob@example.com, carol@example.com');
    console.log('   Admin User: admin@example.com');
    console.log('   (Note: You\'ll need to create these accounts in Firebase Auth)');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('\n✨ Seeding complete! You can now start the application.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
