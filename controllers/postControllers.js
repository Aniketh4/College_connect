const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const PostLike = require("../models/PostLike");
const paginate = require("../util/paginate");
const cooldown = new Set();

function appendUniqueWords(content) {
  const deDict = require('@shopping24/rake-js/dist/de');
  const rakejs = require('@shopping24/rake-js');
  console.log("package mila")
  const { result } = rakejs.extract(content)
    .setOptions({ articles: deDict.articles, stopWords: deDict.stopwords.concat(deDict.articles) })
    .pipe(rakejs.extractKeyPhrases)
    .pipe(rakejs.extractAdjoinedKeyPhrases)
    .pipe(rakejs.keywordLengthFilter)
    .pipe(rakejs.distinct)
    .pipe(rakejs.scoreWordFrequency)
    .pipe(rakejs.sortByScore);

  let phrasesArray = [];

  for (const element of result) {
    let currentPhrase = element.phrase;
    let words = currentPhrase.split(' ');
    let filteredWords = words.filter(word => word.length >= 5);

    phrasesArray.push(filteredWords);
  }
  console.log("thoda hua")
  let flatArray = phrasesArray.flat();
  let uniqueWordsArray = flatArray.filter((word, index, array) => array.indexOf(word) === index);

  // Create a string with unique words separated by a space
  const uniqueWordsString = uniqueWordsArray.map(word => `#${word}`).join(' ');

  // Append the unique words to the content, starting on a new line
  const modifiedContent = `${content}\n\n${uniqueWordsString}`;


  return modifiedContent;
}

USER_LIKES_PAGE_SIZE = 9;

const createPost = async (req, res) => {
  try {
    let { title, content, category, userId } = req.body;

    if (!(title && content)) {
      throw new Error("All input required");
    }
  
  // Check if 'category' is present and not empty
  if (!category) {
    return res.status(400).json({ error: 'Category is required.' });
  }

  content=appendUniqueWords(content);

    const post = await Post.create({
      title,
      content,
      category,
      poster: userId,
    });

    res.json(post);
  } catch (err) {
    console.log(err.message)
    return res.status(400).json({ error: err.message });
  }
};

const getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw new Error("Post does not exist");
    }

    const post = await Post.findById(postId)
      .populate("poster", "-password")
      .lean();

    if (!post) {
      throw new Error("Post does not exist");
    }

    if (userId) {
      await setLiked([post], userId);
    }

    await enrichWithUserLikePreview([post]);

    return res.json(post);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { content, userId, isAdmin } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      throw new Error("Post does not exist");
    }

    if (post.poster != userId && !isAdmin) {
      throw new Error("Not authorized to update post");
    }

    post.content = content;
    post.edited = true;

    await post.save();

    return res.json(post);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId, isAdmin } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      throw new Error("Post does not exist");
    }

    if (post.poster != userId && !isAdmin) {
      throw new Error("Not authorized to delete post");
    }

    await post.remove();

    await Comment.deleteMany({ post: post._id });

    return res.json(post);
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: err.message });
  }
};

const setLiked = async (posts, userId) => {
  let searchCondition = {};
  if (userId) searchCondition = { userId };

  const userPostLikes = await PostLike.find(searchCondition); //userId needed

  posts.forEach((post) => {
    userPostLikes.forEach((userPostLike) => {
      if (userPostLike.postId.equals(post._id)) {
        post.liked = true;
        return;
      }
    });
  });
};

const enrichWithUserLikePreview = async (posts) => {
  const postMap = posts.reduce((result, post) => {
    result[post._id] = post;
    return result;
  }, {});

  const postLikes = await PostLike.find({
    postId: { $in: Object.keys(postMap) },
  })
    .limit(200)
    .populate("userId", "username");

  postLikes.forEach((postLike) => {
    const post = postMap[postLike.postId];
    if (!post.userLikePreview) {
      post.userLikePreview = [];
    }
    post.userLikePreview.push(postLike.userId);
  });
};

const getUserLikedPosts = async (req, res) => {
  try {
    const likerId = req.params.id;
    const { userId } = req.body;
    let { page, sortBy } = req.query;

    if (!sortBy) sortBy = "-createdAt";
    if (!page) page = 1;

    let posts = await PostLike.find({ userId: likerId })
      .sort(sortBy)
      .populate({ path: "postId", populate: { path: "poster" } })
      .lean();

    posts = paginate(posts, 10, page);

    const count = posts.length;

    let responsePosts = [];
    posts.forEach((post) => {
      responsePosts.push(post.postId);
    });

    if (userId) {
      await setLiked(responsePosts, userId);
    }

    await enrichWithUserLikePreview(responsePosts);

    return res.json({ data: responsePosts, count });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: err.message });
  }
};

const getPosts = async (req, res) => {
  try {
    const { userId } = req.body;

    let { page, sortBy, author, search, liked, category } = req.query;

    if (!sortBy) sortBy = "-createdAt";
    if (!page) page = 1;
    
    let postsQuery = Post.find();
    
    // Filter by category
    if (category && category!=undefined) {
      postsQuery = postsQuery.where("category").equals(category);
      console.log(category)
    }
    
    let posts = await postsQuery
      .populate("poster", "-password")
      .sort(sortBy)
      .lean();
    
    // Apply additional filters after fetching posts
    if (author) {
      posts = posts.filter((post) => post.poster.username === author);
    }
    
    // Filter by search
    if (search) {
      posts = posts.filter((post) =>
        post.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    console.log(posts.length);
       

    const count = posts.length;

    posts = paginate(posts, 10, page);

    if (userId) {
      await setLiked(posts, userId);
    }

    await enrichWithUserLikePreview(posts);

    return res.json({ data: posts, count });
  } catch (err) {
    console.log(err.message);
    return res.status(400).json({ error: err.message });
  }
};


const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      throw new Error("Post does not exist");
    }

    const existingPostLike = await PostLike.findOne({ postId, userId });

    if (existingPostLike) {
      throw new Error("Post is already liked");
    }

    await PostLike.create({
      postId,
      userId,
    });

    post.likeCount = (await PostLike.find({ postId })).length;

    await post.save();

    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const unlikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      throw new Error("Post does not exist");
    }

    const existingPostLike = await PostLike.findOne({ postId, userId });

    if (!existingPostLike) {
      throw new Error("Post is already not liked");
    }

    await existingPostLike.remove();

    post.likeCount = (await PostLike.find({ postId })).length;

    await post.save();

    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const getUserLikes = async (req, res) => {
  try {
    const { postId } = req.params;
    const { anchor } = req.query;

    const postLikesQuery = PostLike.find({ postId: postId })
      .sort("_id")
      .limit(USER_LIKES_PAGE_SIZE + 1)
      .populate("userId", "username");

    if (anchor) {
      postLikesQuery.where("_id").gt(anchor);
    }

    const postLikes = await postLikesQuery.exec();

    const hasMorePages = postLikes.length > USER_LIKES_PAGE_SIZE;

    if (hasMorePages) postLikes.pop();

    const userLikes = postLikes.map((like) => {
      return {
        id: like._id,
        username: like.userId.username,
      };
    });

    return res
      .status(400)
      .json({ userLikes: userLikes, hasMorePages, success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

module.exports = {
  getPost,
  getPosts,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getUserLikedPosts,
  getUserLikes,
};
