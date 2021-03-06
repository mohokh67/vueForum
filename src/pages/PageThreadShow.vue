<template>
  <div v-if="asyncDataStatus_ready" class="col-large push-top">
    <h1>
      {{ thread.title }}
      <router-link
        :to="{name: 'ThreadEdit', id: this.id}"
        class="btn btn-green btn-small"
        tag="button"
      >
        Edit Thread
      </router-link>
    </h1>
    <p>By
      <a href="#" class="link-unstyled">{{user.name}}</a> <AppDate :timestamp="thread.publishedAt" />
      <span class="hide-mobile text-faded text-small">{{repliedCount}} replies by {{contributersCount}} contributers</span>
    </p>
    <PostList :posts="posts"/>
    <PostEditor
      v-if="authUser"
      :threadId="id"
    />
    <div v-else class="text-center">
      <router-link :to="{name: 'SignIn', query: {redirectTo: $route.path}}">Sign in</router-link> or
      <router-link :to="{name: 'Register', query: {redirectTo: $route.path}}">Register</router-link> to post a reply
    </div>

  </div>
</template>


<script>
  import PostList from '@/components/PostList'
  import PostEditor from '@/components/PostEditor'
  import { mapGetters, mapActions } from 'vuex'
  import {countObjectProperties} from '@/helpers'
  import asyncDataStatus from '@/mixins/asyncDataStatus'

  export default {
    components: {
      PostList,
      PostEditor
    },

    mixins: [asyncDataStatus],

    props: {
      id: {
        type: String,
        required: true
      }
    },

    computed: {
      ...mapGetters({
        'threadRepliesTotal': 'threads/threadRepliesCount',
        'findThread': 'threads/findThread',
        'findUser': 'users/findUser'
      }),

      ...mapGetters({
        authUser: 'auth/authUser'
      }),

      user () {
        return this.findUser(this.thread.userId)
      },

      repliedCount () {
        return this.threadRepliesTotal(this.thread['.key'])
      },

      contributersCount () {
        return countObjectProperties(this.thread.contributors)
      },

      thread () {
        return this.findThread(this.id)
      },

      posts () {
        const postIds = Object.values(this.thread.posts)
        return Object.values(this.$store.state.posts.items)
          .filter(post => postIds.includes(post['.key']))
      }
    },

    methods: {
      ...mapActions('threads', ['fetchThread']),
      ...mapActions('users', ['fetchUser']),
      ...mapActions('posts', ['fetchPost', 'fetchPosts'])
    },

    created () {
      this.fetchThread({id: this.id})
        .then(thread => {
          this.fetchUser({id: thread.userId})
          return this.fetchPosts({ids: Object.keys(thread.posts)})
        })

        .then(posts => Promise.all(posts.map(post => this.fetchUser({id: post.userId}))))
        .then(() => { this.asyncDataStatus_fetched() })
    }

  }
</script>
