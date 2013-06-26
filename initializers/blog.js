// initializers/blog.js

exports.blog = function(api, next){
  var redis = api.redis.client;
  api.blog = {

    // constants

    seperator: ";",
    postPrefix: "posts",
    commentPrefix: "comments:",

    // posts
    
    addPost: function(userName, title, content, next){
      var key = this.buildTitleKey(userName, title);
      var data = {
        content: content,
        title: title,
        userName: userName,
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
      }
      redis.hmset(key, data, function(error){
        next(error)
      });
    },

    viewPost: function(userName, title, next){
      var key = this.buildTitleKey(userName, title);
      redis.hgetall(key, function(error, data){
        next(error, data);
      });
    },

    listUserPosts: function(userName, next){
      var self = this;
      var search = self.postPrefix + self.seperator + userName + self.seperator;
      redis.keys(search+"*", function(error, keys){
        var titles = [];
        var started = 0;
        keys.forEach(function(key){
          var parts = keys.split(self.seperator)
          var key = parts[(parts.length - 1)];
          titles.push(key);
        });
        titles.sort();
        next(error, titles)
      });
    },
    
    editPost: function(userName, title, content, next){
      var key = this.buildTitleKey(userName, title);
      this.viewPost(key, function(error, data){
        var newData = {
          content: content,
          title: title,
          userName: userName,
          createdAt: data.createdAt,
          updatedAt: new Date().getTime(),
        }
        redis.hmset(key, newData, function(error){
          next(error)
        });
      });
    },
    
    deletePost: function(userName, title, next){
      var self = this;
      var key = self.buildTitleKey(userName, title);
      redis.del(key, function(error){
        if(error){
          next(error);
        }else{
          var commentKey = self.buildCommentKey(userName, title);
          redis.del(commentKey, function(error){
            next(error);
          });
        }
      });
    },

    // comments

    addComment: function(userName, title, commenterName, comment, next){
      var key = this.buildCommentKey(userName, title);
      var commentId = this.buildCommentId(commenterName);
      var data = {
        comment: comment,
        createdAt: new Date().getTime(),
        commentId: commentId
      }
      redis.hset(key, commentId, JSON.stringify(data), function(error){
        next(error);
      })
    }, 

    viewComments: function(userName, title, next){
      var key = this.buildCommentKey(userName, title);
      redis.hgetall(key, function(error, data){
        var comments = [];
        for(var i in data){
          comments.push( JSON.parse( data[i] ) );
        }
        next(error, comments);
      })
    },
    
    deleteComment: function(userName, title, commentId, next){
      var key = this.buildCommentKey(userName, title);
      redis.hdel(key, commentId, function(error){
        next(error);
      })
    },

    // helpers

    buildTitleKey: function(userName, title){
      return this.postPrefix + this.seperator + userName + this.seperator + title // "posts:evan:my first post"
    },
    buildCommentKey: function(userName, title){
      return this.commentPrefix + this.seperator + userName + this.seperator + title // "comments:evan:my first post"
    },
    buildCommentId: function(commenterName){
      return commenterName + new Date().getTime();
    }

  }

  next();
}
