const { initializeFirebase, getFirestore } = require('../config/firebase');

// Predefined tags list
const PREDEFINED_TAGS = [
  'Politics', 'Economics', 'Technology', 'Science', 'Environment',
  'Education', 'Religion', 'Ethics', 'Law', 'Media',
  'Art', 'Music', 'Film', 'Sports', 'Health',
  'Food', 'Travel', 'Relationships', 'Family', 'Friendship',
  'Career', 'Fashion', 'Pets', 'Gaming', 'Internet',
  'History', 'Philosophy', 'Space', 'Lifestyle'
];

// Function to get a random tag from the predefined list
function getRandomTag() {
  return PREDEFINED_TAGS[Math.floor(Math.random() * PREDEFINED_TAGS.length)];
}

// Function to assign appropriate tag based on post content
function getAppropriateTag(postTitle, postBody) {
  const content = (postTitle + ' ' + (postBody || '')).toLowerCase();
  
  // Define keywords for each tag
  const tagKeywords = {
    'Politics': ['government', 'election', 'vote', 'policy', 'politician', 'democracy', 'political'],
    'Economics': ['money', 'economy', 'financial', 'market', 'business', 'economic', 'finance', 'income'],
    'Technology': ['tech', 'ai', 'artificial intelligence', 'computer', 'software', 'digital', 'internet', 'app'],
    'Science': ['research', 'study', 'scientific', 'experiment', 'discovery', 'theory'],
    'Environment': ['climate', 'environmental', 'nature', 'pollution', 'sustainability', 'green'],
    'Education': ['school', 'college', 'university', 'learn', 'education', 'student', 'teach'],
    'Religion': ['god', 'religious', 'faith', 'church', 'spiritual', 'belief'],
    'Ethics': ['moral', 'ethical', 'right', 'wrong', 'ethics', 'values'],
    'Law': ['legal', 'court', 'justice', 'law', 'lawyer', 'judge'],
    'Media': ['news', 'social media', 'television', 'newspaper', 'journalism'],
    'Art': ['art', 'artist', 'creative', 'painting', 'sculpture'],
    'Music': ['music', 'song', 'band', 'musician', 'concert'],
    'Film': ['movie', 'film', 'cinema', 'actor', 'director'],
    'Sports': ['sport', 'athlete', 'game', 'team', 'competition', 'football', 'basketball'],
    'Health': ['health', 'medical', 'doctor', 'medicine', 'fitness', 'wellness'],
    'Food': ['food', 'eat', 'restaurant', 'cooking', 'recipe', 'meal'],
    'Travel': ['travel', 'vacation', 'trip', 'tourism', 'destination'],
    'Relationships': ['relationship', 'dating', 'love', 'partner', 'romance'],
    'Family': ['family', 'parent', 'child', 'mother', 'father', 'kids'],
    'Friendship': ['friend', 'friendship', 'buddy', 'companion'],
    'Career': ['job', 'work', 'career', 'employment', 'professional', 'workplace'],
    'Fashion': ['fashion', 'style', 'clothing', 'dress', 'outfit'],
    'Pets': ['pet', 'dog', 'cat', 'animal', 'puppy'],
    'Gaming': ['game', 'gaming', 'video game', 'player', 'console'],
    'Internet': ['online', 'website', 'digital', 'cyber', 'web'],
    'History': ['history', 'historical', 'past', 'ancient', 'century'],
    'Philosophy': ['philosophy', 'philosophical', 'meaning', 'existence', 'wisdom'],
    'Space': ['space', 'planet', 'universe', 'astronomy', 'cosmic'],
    'Lifestyle': ['lifestyle', 'living', 'daily', 'routine', 'habit']
  };
  
  // Find the best matching tag
  let bestMatch = null;
  let maxScore = 0;
  
  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    let score = 0;
    keywords.forEach(keyword => {
      if (content.includes(keyword)) {
        score += 1;
      }
    });
    
    if (score > maxScore) {
      maxScore = score;
      bestMatch = tag;
    }
  }
  
  // If no keywords match, return a random tag
  return bestMatch || getRandomTag();
}

async function updatePostsWithPredefinedTags() {
  try {
    console.log('🏷️ Starting posts update with predefined tags...');
    console.log(`Available tags: ${PREDEFINED_TAGS.join(', ')}`);
    console.log('');
    
    // Initialize Firebase
    initializeFirebase();
    const db = getFirestore();
    
    // Get all posts
    const postsSnapshot = await db.collection('posts').get();
    
    if (postsSnapshot.empty) {
      console.log('No posts found to update.');
      return;
    }
    
    console.log(`Found ${postsSnapshot.size} posts to update...`);
    console.log('');
    
    const batch = db.batch();
    let updateCount = 0;
    
    postsSnapshot.forEach((doc) => {
      const postData = doc.data();
      const title = postData.title || '';
      const body = postData.body || '';
      
      // Get appropriate tag based on content
      const newTag = getAppropriateTag(title, body);
      
      batch.update(doc.ref, {
        tags: [newTag],
        updatedAt: new Date()
      });
      
      updateCount++;
      console.log(`📝 "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}" → ${newTag}`);
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log('');
      console.log(`✅ Successfully updated ${updateCount} posts with predefined tags`);
      
      // Show tag distribution
      const tagCounts = {};
      postsSnapshot.forEach((doc) => {
        const postData = doc.data();
        const title = postData.title || '';
        const body = postData.body || '';
        const tag = getAppropriateTag(title, body);
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
      
      console.log('');
      console.log('📊 Tag distribution:');
      Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([tag, count]) => {
          console.log(`- ${tag}: ${count} post${count !== 1 ? 's' : ''}`);
        });
        
    } else {
      console.log('✅ No posts needed updating');
    }
    
  } catch (error) {
    console.error('❌ Error updating posts:', error);
    throw error;
  }
}

// Run the update if this script is executed directly
if (require.main === module) {
  updatePostsWithPredefinedTags()
    .then(() => {
      console.log('🎉 Posts update completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Posts update failed:', error);
      process.exit(1);
    });
}

module.exports = { updatePostsWithPredefinedTags };


