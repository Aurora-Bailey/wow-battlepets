<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm12 md12>
      <div class="text-xs-center">
        <img src="/v.png" alt="Vuetify.js" class="mb-5" />
      </div>
      <v-card v-if="listings.length > 0" class="mt-5">
        <v-card-title class="headline">Live Rank</v-card-title>
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
              <td>{{ props.item.rank }}</td>
              <td>{{ props.item.owner }}</td>
              <td>{{ props.item.regions }}</td>
              <td>{{ props.item.pets }}</td>
              <td><display-gold :value="props.item.mediantotal"></display-gold></td>
              <td><display-gold :value="props.item.buyouttotal"></display-gold></td>
              <td><display-gold :value="props.item.buyoutavg"></display-gold></td>
              <td>{{ props.item.level }}</td>
              <td>{{ props.item.quality }}</td>
              <td>{{ props.item.ahids }}</td>
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
      }
    },
    data () {
      return {
        listings: [],
        pagination: {descending: false, page: 0, rowsPerPage: -1, sortBy: 'rank'},
        listingsHeadings: [
          {text: 'Rank', value: 'rank'},
          {text: 'Name', value: 'owner'},
          {text: 'Regions', value: 'regions'},
          {text: 'Pets', value: 'pets'},
          {text: 'My Estimate', value: 'mediantotal'},
          {text: 'Total', value: 'buyouttotal'},
          {text: 'Average', value: 'buyoutavg'},
          {text: 'Level', value: 'level'},
          {text: 'Quality', value: 'quality'},
          {text: 'AHs', value: 'ahids'}
        ]
      }
    },
    async asyncData ({ params, $axios, store }) {
      let { data } = await $axios.get(`http://${process.server ? this\.store\.state\.server.replace(this\.store\.state\.publicIp, 'localhost') : store.state.server}/sellerliverank`)
      return {listings: data.data}
    }
  }
</script>
