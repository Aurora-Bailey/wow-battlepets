const config = require('../../config.json')

export const state = () => ({
  realmIndex: {},
  petIndex: {},
  publicIp: config.ipAddress,
  server: config.ipAddress + ':3303',
  harvestServer: config.ipAddress + ':3304',
  liveServer: config.ipAddress + ':3305'
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
    let realmIndexResponse = await app.$axios.$get(`http://${process.server && process.argv[2] !== 'dev' ? this.state.server.replace(this.state.publicIp, 'localhost') : this.state.server}/realmindex`)
    let realmIndex = {}
    realmIndexResponse.forEach(r => realmIndex[r.id] = r)
    commit('setRealmIndex', realmIndex)

    let petIndexResponse = await app.$axios.$get(`http://${process.server && process.argv[2] !== 'dev' ? this.state.server.replace(this.state.publicIp, 'localhost') : this.state.server}/petindex`)
    let petIndex = {}
    petIndexResponse.forEach(r => petIndex[r.speciesId] = r)
    commit('setPetIndex', petIndex)
  }
}
