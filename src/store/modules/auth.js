import firebase from 'firebase'
export default {
  namespaced: true,

  state: {
    authId: null
  },

  getters: {
    authUser (state, getters, rootState) {
      return state.authId ? rootState.users.items[state.authId] : null
    }

  },

  actions: {

    registerUserWithEmailAndPassword ({dispatch}, {email, password, name, username, avatar = null}) {
      return firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(data => {
          return dispatch('users/createUser', {id: data.user.uid, email, password, name, username, avatar}, {root: true})
        })
        .then(() => { dispatch('auth/fetchAuthUser', {}, {root: true}) })
    },

    signInUserWithEmailAndPassword (context, {email, password}) {
      return firebase.auth().signInWithEmailAndPassword(email, password)
    },

    signInWithGoogle ({dispatch}) {
      const provider = new firebase.auth.GoogleAuthProvider()
      return firebase.auth().signInWithPopup(provider)
        .then((data) => {
          const user = data.user
          firebase.database().ref('users').child(user.uid).once('value', snapshot => {
            if (!snapshot.exists()) {
              return dispatch(
                'users/createUser',
                {
                  id: user.uid,
                  email: user.email,
                  name: user.displayName,
                  username: user.email,
                  avatar: user.photoURL
                },
                {root: true}
                ).then(() => { dispatch('auth/fetchAuthUser', {}, {root: true}) })
            }
          })
        })
    },

    signOut ({commit}) {
      return firebase.auth().signOut()
        .then(() => {
          commit('setAuthId', null)
        })
    },

    fetchAuthUser ({dispatch, commit}) {
      const userId = firebase.auth().currentUser.uid
      return new Promise((resolve, reject) => {
        firebase.database().ref('users').child(userId).once('value', snapshot => {
          if (snapshot.exists()) {
            return dispatch('users/fetchUser', {id: userId}, {root: true})
              .then(user => {
                commit('setAuthId', userId)
                resolve(user)
              })
          } else {
            resolve(null)
          }
        })
      })
    }

  },

  mutations: {
    setAuthId (state, id) {
      state.authId = id
    }
  }
}
