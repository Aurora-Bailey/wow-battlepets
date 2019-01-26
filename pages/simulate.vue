<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8 md6>
      <div class="text-xs-center">
        <img src="/v.png" alt="Vuetify.js" class="mb-5" />
      </div>
      <v-card>
        <v-card-title class="headline">Simulate selling your collection</v-card-title>
        <v-card-text>
          <h3 class="blue--text text--lighten-2">Sell settings</h3>
          <v-select color="blue lighten-2" :items="regions" v-model="region" label="Region"></v-select>
          <v-autocomplete color="blue lighten-2" :items="realmList" v-model="realm" label="Realm"></v-autocomplete>
          <v-text-field color="blue lighten-2" label="Character Name" v-model="character"></v-text-field>
          <v-text-field color="blue lighten-2" label="Maximum Discount (percent)" v-model="sellMaxDiscount"></v-text-field>
          <v-text-field color="blue lighten-2" label="Start Time GMT (0-23)" v-model="startTimeGMT"></v-text-field>
          <v-radio-group label="Auction Length" row v-model="auctionLength">
            <v-radio color="blue lighten-2" :key="1" label="12H" :value="12"></v-radio>
            <v-radio color="blue lighten-2" :key="2" label="24H" :value="24"></v-radio>
            <v-radio color="blue lighten-2" :key="3" label="48H" :value="48"></v-radio>
          </v-radio-group>

          <h3 class="orange--text text--lighten-2">Buy settings</h3>
          <v-text-field color="orange lighten-2" label="Maximum Buyout (gold)" v-model="buyMaxBuyout"></v-text-field>
          <v-text-field color="orange lighten-2" label="Minimum Profit (gold)" v-model="buyMinProfit"></v-text-field>
          <v-text-field color="orange lighten-2" label="Minimum Markup (percent)" v-model="buyMinMarkup"></v-text-field>
          <v-text-field color="orange lighten-2" label="Minimum Sell Rate" v-model="buyMinSellRate"></v-text-field>
          <v-checkbox color="orange lighten-2" label="Rare quality only" v-model="buyRareOnly"></v-checkbox>
          <v-radio-group label="Pet Level" row v-model="buyPetLevel">
            <v-radio color="orange lighten-2" :key="1" label="1" :value="1"></v-radio>
            <v-radio color="orange lighten-2" :key="25" label="25" :value="25"></v-radio>
          </v-radio-group>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="sendRequest">Continue</v-btn>
        </v-card-actions>
      </v-card>
      <v-card class="mt-5">
        <v-card-text>
          {{ state }}
        </v-card-text>
      </v-card>
      <v-card v-if="listings.length > 0" class="mt-5">
        <v-card-title class="headline">Simulation</v-card-title>
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
              <td>{{ auctionHouseNameLookup[props.item.ahid] }}</td>
              <td><display-gold :value="props.item.sellBuyGold"></display-gold></td>
              <td><display-gold :value="props.item.sellBuyGoldLeft"></display-gold></td>
              <td><display-gold :value="props.item.sellGold"></display-gold></td>
              <td>{{ props.item.gain }}%</td>
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
  var socket = null

  export default {
    mounted () {
      socket = new WebSocket(`ws://${this.$store.state.liveServer}`)
      socket.json = (obj) => { socket.send(JSON.stringify(obj)) }
      socket.addEventListener('message', (event) => {
        let obj = JSON.parse(event.data)
        if (obj.m === 'state') {
          this.state = obj.d
        } else if (obj.m === 'ahstats') {
          this.listings.push(obj)
        }
      });
    },
    beforeDestroy () {
      if (socket && socket.close) socket.close()
    },
    computed: {
      regions () {
        return Object.keys(this.$store.state.realmIndex)
        .map(r => this.$store.state.realmIndex[r].regionTag)
        .reduce((a, v) => { if (!a.includes(v)) a.push(v); return a }, [])
      },
      realmList () {
        return Object.keys(this.$store.state.realmIndex)
        .map(r => { return {text: this.$store.state.realmIndex[r].name, value: this.$store.state.realmIndex[r].id, region: this.$store.state.realmIndex[r].regionTag} })
        .filter(r => { return r.region === this.region })
        .sort((a, b) => { return a.text > b.text ? 1:-1 })
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
      }
    },
    data () {
      return {
        region: 'US',
        realm: 106,
        character: 'Napri',
        sellMaxDiscount: 60,
        buyMinProfit: 1000,
        buyMaxBuyout: 500000,
        buyMinSellRate: 200,
        buyPetLevel: 1,
        buyMinMarkup: 10,
        buyRareOnly: true,
        auctionLength: 24,
        startTimeGMT: 15,
        state: 'init',
        listings: [],
        pagination: {descending: true, page: 0, rowsPerPage: -1, sortBy: 'sellBuyGold'},
        listingsHeadings: [
          {text: 'Name', value: 'ahid'},
          {text: 'Sell Buy', value: 'sellBuyGold'},
          {text: 'Sell Buy Leftover', value: 'sellBuyGoldLeft'},
          {text: 'Sell', value: 'sellGold'},
          {text: 'Gain', value: 'gain'}
        ]
      }
    },
    methods: {
      async sendRequest (event) {
        this.listings = []
        let {realm, character, sellMaxDiscount, buyMinProfit, buyMaxBuyout, buyMinSellRate, buyPetLevel, buyMinMarkup, buyRareOnly, auctionLength, startTimeGMT} = this
        socket.json({m: 'simulate', realm, character, sellMaxDiscount, buyMinProfit, buyMaxBuyout, buyMinSellRate, buyPetLevel, buyMinMarkup, buyRareOnly, auctionLength, startTimeGMT})
      }
    }
  }
</script>
