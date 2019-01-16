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
          <div>Name: Realm name(s)</div>
          <div>Market Cap: The sum buyout of all live auctions on the auctionhouse</div>
          <div>Volume: How many battle pets are currently on the auctionhouse</div>
          <div>TTSV: Time to sell volume; Volume * Sell Rate</div>
          <div>Avg Sell: The average sell price of the last 1000 pets sold</div>
          <div>Sell Rate: The average time between each battle pet sell for the last 1000 sold</div>
          <div>Last Update: The last time this record was updated</div>
          <div>S:C:E: Sold Canceled Expired from the last 5000 battle pets</div>
          <div>Buyable: Number of unique rare level 1 pets that can be bought and sold for 100% markup. &#x3E;100k : &#x3E;10k : &#x3E;1k : &#x3E;100 : &#x3E; 10 : &#x3E;0</div>
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
              <td>{{ msToTimeString(props.item.ttsv) }}</td>
              <td><display-gold :value="props.item.sellPriceAvg"></display-gold></td>
              <td>{{msToTimeString(props.item.sellRate)}}</td>
              <td>{{msToTimeString(Date.now() - props.item.lastUpdate)}}</td>
              <td>
                <span style="color: lime">{{props.item.soldOfFiveThousand}}</span> :
                <span style="color: orange">{{props.item.canceledOfFiveThousand}}</span> :
                <span style="color: #FF5555">{{props.item.expiredOfFiveThousand}}</span>
              </td>
              <td>
                <span>{{ props.item.halfPriceUnique }}</span> --
                <span style="color: #FF5555">{{ props.item.halfPriceUniqueOverOneHundredThousand }}</span> :
                <span style="color: orange">{{ props.item.halfPriceUniqueOverTenThousand }}</span> :
                <span style="color: yellow">{{ props.item.halfPriceUniqueOverOneThousand }}</span> :
                <span style="color: lime">{{ props.item.halfPriceUniqueOverOneHundred }}</span> :
                <span style="color: cyan">{{ props.item.halfPriceUniqueOverTen }}</span> :
                <span style="color: magenta">{{ props.item.halfPriceUniqueOverZero }}</span>
              </td>
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
          let ttsv = item.sellRate * item.liveVolume // time to sell volume
          list.push(Object.assign(item, {name, ttsv}))
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
          {text: 'Name', value: 'name', width: 250},
          {text: 'Market Cap', value: 'liveMarketCap'},
          {text: 'Volume', value: 'liveVolume'},
          {text: 'TTSV', value: 'ttsv'},
          {text: 'Avg Sell', value: 'sellPriceAvg'},
          {text: 'Sell Rate', value: 'sellRate'},
          {text: 'Last Update', value: 'lastUpdate'},
          {text: 'S:C:E', value: 'soldOfFiveThousand'},
          {text: 'Buyable', value: 'halfPriceUnique'}
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
