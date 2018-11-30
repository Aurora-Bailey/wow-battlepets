
export const state = () => ({
  realmIndex: {},
  petIndex: {}
})

export const mutations = {
  setRealmIndex (state, index) {
    state.realmIndex = index
  },
  setPetIndex (state, index) {
    state.petIndex = index
  }
}

export const actions = {
  async nuxtServerInit ({ commit }, { app, req }) {
    console.log(req.url)
    let realmIndexResponse = await app.$axios.$get('http://localhost:3303/realmindex')
    let realmIndex = {}
    realmIndexResponse.forEach(r => realmIndex[r.id] = r)
    commit('setRealmIndex', realmIndex)

    let petIndexResponse = await app.$axios.$get('http://localhost:3303/petindex')
    let petIndex = {}
    petIndexResponse.forEach(r => petIndex[r.speciesId] = r)
    commit('setPetIndex', petIndex)
  }
}
