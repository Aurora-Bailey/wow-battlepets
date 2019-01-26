
export const state = () => ({
  realmIndex: {},
  petIndex: {},
  server: '54.244.210.52:3303',
  harvestServer: '54.244.210.52:3304',
  liveServer: '54.244.210.52:3305'
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
    let realmIndexResponse = await app.$axios.$get(`http://${this.state.server}/realmindex`)
    let realmIndex = {}
    realmIndexResponse.forEach(r => realmIndex[r.id] = r)
    commit('setRealmIndex', realmIndex)

    let petIndexResponse = await app.$axios.$get(`http://${this.state.server}/petindex`)
    let petIndex = {}
    petIndexResponse.forEach(r => petIndex[r.speciesId] = r)
    commit('setPetIndex', petIndex)
  }
}
