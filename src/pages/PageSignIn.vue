<template>
  <div class="flex-grid justify-center">
    <div class="col-2">

      <form @submit.prevent="signIn" class="card card-form">
        <h1 class="text-center">Login</h1>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            v-model="form.email"
            @blur="$v.form.email.$touch()"
            id="email"
            type="email"
            class="form-input">
          <template v-if="$v.form.email.$error">
            <span v-if="!$v.form.email.required" class="form-error">It is required</span>
            <span v-else-if="!$v.form.email.email" class="form-error">It should be a valid email</span>
          </template>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            v-model="form.password"
            @blur="$v.form.password.$touch()"
            id="password"
            type="password"
            class="form-input">
          <span v-if="$v.form.password.$error && !$v.form.password.required" class="form-error">It is required</span>
        </div>

        <div v-if="message" class="form-group">
          <p class="error">{{message}}</p>
        </div>

        <div class="push-top">
          <button type="submit" class="btn-blue btn-block">Log in</button>
        </div>

        <div class="form-actions text-right">
          <router-link :to="{name: 'Register'}">Create an account?</router-link>
        </div>
      </form>

      <div class="push-top text-center">
        <button @click.prevent="registerWithGoogle" class="btn-red btn-xsmall"><i class="fa fa-google fa-btn"></i>Sign in with Google</button>
      </div>

    </div>
  </div>
</template>
<script>
  import {mapActions} from 'vuex'
  import {required, email} from 'vuelidate/lib/validators'

  export default {

    data () {
      return {
        form: {
          email: null,
          password: null
        },
        message: null
      }
    },

    validations: {
      form: {
        email: {
          required,
          email
        },
        password: {
          required
        }
      }
    },

    methods: {
      ...mapActions('auth', ['signInUserWithEmailAndPassword', 'signInWithGoogle']),

      signIn () {
        this.$v.form.$touch()
        if (this.$v.form.$invalid) {
          console.log('Login form not submitted. Error in form validation')
          return
        }
        console.log('login form has validated.')

        this.signInUserWithEmailAndPassword({email: this.form.email, password: this.form.password})
          .then(() => this.successRedirect())
          .catch(error => { this.message = error.message })
      },

      registerWithGoogle () {
        this.signInWithGoogle()
          .then(() => this.successRedirect())
          .catch(error => { this.message = error.message })
      },

      successRedirect () {
        // $router:global router
        // $route: current route
        const redirectTo = this.$route.query.redirectTo || {name: 'Home'}
        this.$router.push(redirectTo)
      }

    },

    created () {
      this.$emit('ready')
    }
  }
</script>

<style scoped>
  .error{
    color: red
  }
</style>

