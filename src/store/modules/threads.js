import firebase from 'firebase'
import {countObjectProperties, appendChildToParentMutation, currentTimestamp} from '@/helpers'

export default {
  namespaced: true,

  state: {
    items: {}
  },

  getters: {
    threadRepliesCount: (state) => (id) => countObjectProperties(state.items[id].posts) - 1,
    findThread: (state) => (id) => state.items[id]
  },

  actions: {
    createThread ({state, commit, dispatch, rootState}, {text, title, forumId}) {
      return new Promise((resolve, reject) => {
        const publishedAt = Math.floor(Date.now() / 1000)
        const userId = rootState.auth.authId
        const threadId = firebase.database().ref('threads').push().key
        const postId = firebase.database().ref('posts').push().key

        const thread = {title, forumId, publishedAt, userId, firstPostId: postId, posts: {}}
        thread.posts[postId] = postId
        const post = {text, publishedAt, threadId, userId}

        const updates = {}
        updates[`threads/${threadId}`] = thread
        updates[`forums/${forumId}/threads/${threadId}`] = threadId
        updates[`users/${userId}/threads/${threadId}`] = threadId

        updates[`posts/${postId}`] = post
        updates[`users/${userId}/posts/${postId}`] = postId
        firebase.database().ref().update(updates)
          .then(() => {
            // thread
            commit('setItem', {item: thread, id: threadId, resource: 'threads'}, {root: true})
            commit('users/addThreadToUser', {parentId: userId, childId: threadId}, {root: true})
            commit('forums/addThreadToForum', {parentId: forumId, childId: threadId}, {root: true})
            // post
            commit('setItem', {item: post, id: postId, resource: 'posts'}, {root: true})
            commit('threads/addPostToThread', {childId: postId, parentId: post.threadId}, {root: true})
            commit('users/addPostToUser', {parentId: post.userId, childId: postId}, {root: true})

            resolve(state.items[threadId])
          })
      })
    },

    updateThread ({state, commit, rootState}, {id, text, title}) {
      return new Promise((resolve, reject) => {
        const thread = state.items[id]
        const post = rootState.posts.items[thread.firstPostId]
        const edited = {at: currentTimestamp(), by: rootState.auth.authId}

        const newThread = {...thread, title}
        const newPost = {...post, text, edited}

        const updates = {}
        updates[`posts/${thread.firstPostId}/text`] = text
        updates[`posts/${thread.firstPostId}/edited`] = edited
        updates[`threads/${id}/title`] = title
        firebase.database().ref().update(updates)
          .then(() => {
            commit('setItem', {item: newThread, id, resource: 'threads'}, {root: true})
            commit('setItem', {item: newPost, id: thread.firstPostId, resource: 'posts'}, {root: true})
            resolve(newThread)
          })
      })
    },

    fetchThread: ({dispatch}, {id}) => dispatch('fetchItem', {resource: 'threads', id}, {root: true}),
    fetchThreads: ({dispatch}, {ids}) => dispatch('fetchItems', {ids, resource: 'threads'}, {root: true})
  },

  mutations: {
    addPostToThread: appendChildToParentMutation({child: 'posts'}),
    addContributorToThread: appendChildToParentMutation({child: 'contributors'})
  }
}
