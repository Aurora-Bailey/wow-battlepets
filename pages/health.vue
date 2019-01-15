<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8 md6>
      <div class="text-xs-center">
        <img src="/v.png" alt="Vuetify.js" class="mb-5" />
      </div>
      <v-card>
        <v-card-title class="headline">Realm Health</v-card-title>
        <v-card-text>
          <v-select :items="regions" v-model="region" label="Region"></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="requestData">Continue</v-btn>
        </v-card-actions>
      </v-card>
      <v-card v-if="listings.length > 0" class="mt-5">
        <v-card-title class="headline">Realm Health</v-card-title>
        <v-card-text>
          <v-data-table
            :headers="listingsHeadings"
            :items="listings"
            class="elevation-1"
            :rows-per-page-items="[ 50, 100, 500 ]"
            must-sort
            :pagination.sync="pagination"
          >
            <template slot="items" slot-scope="props">
              <td>{{ props.item.name }}</td>
              <td><display-gold :value="props.item.liveMarketCap"></display-gold></td>
              <td>{{ props.item.liveVolume }}</td>
              <td><display-gold :value="props.item.sellPriceAvg"></display-gold></td>
              <td>{{msToTimeString(props.item.sellRate)}}</td>
              <td>{{msToTimeString(Date.now() - props.item.lastUpdate)}}</td>
            </template>
          </v-data-table>
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
        region: 'US',
        listingsRaw: [],
        pagination: {descending: false, page: 0, rowsPerPage: -1, sortBy: 'sellRate'},
        listingsHeadings: [
          {text: 'Name', value: 'name'},
          {text: 'Market Cap', value: 'liveMarketCap'},
          {text: 'Volume', value: 'liveVolume'},
          {text: 'Avg Sell', value: 'sellPriceAvg'},
          {text: 'Sell Rate', value: 'sellRate'},
          {text: 'Last Update', value: 'lastUpdate'}
        ]
      }
    },
    methods: {
      async requestData (event) {
        this.listingsRaw = []
        this.listingsRaw = await this.$axios.$get(`http://${this.$store.state.server}/health`)
      },
      msToTimeString (ms) {
        let str = ''
        let hours = Math.floor(ms / (1000*60*60))
        ms = ms % (1000*60*60)
        let minutes = Math.floor(ms / (1000*60))
        ms = ms % (1000*60)
        let seconds = Math.floor(ms / (1000))
        ms = ms % (1000)
        if (hours) return `${hours}h ${minutes}m ${seconds}s`
        if (minutes) return `${minutes}m ${seconds}s`
        if (seconds) return `${seconds}s`
      }
    }
  }
</script>
