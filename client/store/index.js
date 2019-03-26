
export const state = () => ({
  realmIndex: {},
  petIndex: {},
  publicIp: '54.244.210.52',
  server: this.publicIp + ':3303',
  harvestServer: this.publicIp + ':3304',
  liveServer: this.publicIp + ':3305'
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
    let realmIndexResponse = await app.$axios.$get(`http://${process.server ? this.state.server.replace(this.state.publicIp, 'localhost') : this.state.server}/realmindex`)
    let realmIndex = {}
    realmIndexResponse.forEach(r => realmIndex[r.id] = r)
    commit('setRealmIndex', realmIndex)

    let petIndexResponse = await app.$axios.$get(`http://${process.server ? this.state.server.replace(this.state.publicIp, 'localhost') : this.state.server}/petindex`)
    let petIndex = {}
    petIndexResponse.forEach(r => petIndex[r.speciesId] = r)
    commit('setPetIndex', petIndex)
  }
}
