<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8 md6>
      <div class="text-xs-center">
        <img src="/v.png" alt="Vuetify.js" class="mb-5" />
      </div>
      <v-card>
        <v-card-title class="headline">Commands</v-card-title>
        <v-card-text>
          <v-btn color="warning" @click="requestPause">Pause</v-btn>
          <v-btn color="primary" @click="requestPlay">Play</v-btn>
          <v-btn color="primary" @click="requestPending">Pending</v-btn>
          <v-btn color="primary" @click="requestPm2list">Pm2 List</v-btn>
          <v-btn color="primary" @click="requestVersion">Version</v-btn>
          <v-btn color="primary" @click="requestGitPull">Git Pull</v-btn>
          <v-btn color="error" @click="requestRestartHarvest">Restart Harvest</v-btn>
          <v-btn color="error" @click="requestRestartServer">Restart Server</v-btn>
          <v-btn color="error" @click="requestRestartLive">Restart Live</v-btn>
        </v-card-text>
      </v-card>
      <v-card class="mt-5" v-if="consoleOut !== ''">
        <v-card-title class="headline">Console Log</v-card-title>
        <v-card-text>
          <code>{{ consoleOut }}</code>
        </v-card-text>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<style>
</style>

<script>
  export default {
    computed: {
      regions () {
        return Object.keys(this.$store.state.realmIndex)
        .map(r => this.$store.state.realmIndex[r].regionTag)
        .reduce((a, v) => { if (!a.includes(v)) a.push(v); return a }, [])
      },
      auctionHouseNameLookup () {
        let ahLookup = {}
        Object.keys(this.$store.state.realmIndex).forEach(index => {
          let realm = this.$store.state.realmIndex[index]
          if (typeof ahLookup[realm.ahid] === 'undefined') ahLookup[realm.ahid] = []
          ahLookup[realm.ahid].push(realm.name)
        })
        Object.keys(ahLookup).forEach(index => {
          ahLookup[index] = ahLookup[index].join(', ')
        })
        return ahLookup
      },
      auctionHouseRegionLookup () {
        let ahLookup = {}
        Object.keys(this.$store.state.realmIndex).forEach(index => {
          let realm = this.$store.state.realmIndex[index]
          ahLookup[realm.ahid] = realm.regionTag
        })
        return ahLookup
      },
      listings () {
        let list = []
        this.listingsRaw
        .filter(item => {
          return this.auctionHouseRegionLookup[item.ahid] === this.region
        })
        .forEach(item => {
          let name = this.auctionHouseNameLookup[item.ahid]
          list.push(Object.assign(item, {name}))
        })

        return list
      }
    },
    data () {
      return {
        consoleOut: '',
        pending: 0
      }
    },
    methods: {
      async requestPause (event) {
        this.$axios.$get(`http://${this.$store.state.harvestServer}/pause`)
      },
      async requestPlay (event) {
        this.$axios.$get(`http://${this.$store.state.harvestServer}/play`)
      },
      async requestPending (event) {
        this.consoleOut = ''
        let p = await this.$axios.$get(`http://${this.$store.state.harvestServer}/pending`)
        this.consoleOut = 'Pending: ' + p.data
      },
      async requestGitPull (event) {
        this.consoleOut = ''
        let p = await this.$axios.$get(`http://${this.$store.state.harvestServer}/gitpull`)
        this.consoleOut = p.data
      },
      async requestRestartHarvest (event) {
        this.consoleOut = ''
        let p = await this.$axios.$get(`http://${this.$store.state.harvestServer}/restart/harvest`)
        this.consoleOut = p.data
      },
      async requestRestartServer (event) {
        this.consoleOut = ''
        let p = await this.$axios.$get(`http://${this.$store.state.harvestServer}/restart/server`)
        this.consoleOut = p.data
      },
      async requestRestartLive (event) {
        this.consoleOut = ''
        let p = await this.$axios.$get(`http://${this.$store.state.harvestServer}/restart/live`)
        this.consoleOut = p.data
      },
      async requestVersion (event) {
        this.consoleOut = ''
        let p = await this.$axios.$get(`http://${this.$store.state.harvestServer}/version`)
        this.consoleOut = p.data
      },
      async requestPm2list (event) {
        this.consoleOut = ''
        let p = await this.$axios.$get(`http://${this.$store.state.harvestServer}/pm2list`)
        this.consoleOut = p.data
      }
    }
  }
</script>
