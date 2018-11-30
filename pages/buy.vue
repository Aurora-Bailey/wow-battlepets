<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8 md6>
      <div class="text-xs-center">
        <img src="/v.png" alt="Vuetify.js" class="mb-5" />
      </div>
      <v-card>
        <v-card-title class="headline">Buy pets from realm</v-card-title>
        <v-card-text>
          <v-select :items="regions" v-model="region" label="Region"></v-select>
          <v-autocomplete :items="realmList" v-model="ahid" label="Realm"></v-autocomplete>
          <v-text-field label="Maximum Buyout (gold)" v-model="maxBuyout"></v-text-field>
          <v-text-field label="Minimum Profit (gold)" v-model="minProfit"></v-text-field>
          <v-text-field label="Minimum Markup (percent)" v-model="minMarkup"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="auctionListings">Continue</v-btn>
        </v-card-actions>
      </v-card>
      <v-card v-if="listings.length > 0" class="mt-5">
        <v-card-title class="headline">Live auction listings</v-card-title>
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
              <td><img :src="props.item.image"></td>
              <td>{{ props.item.name }}</td>
              <td>{{ props.item.petLevel }}</td>
              <td v-html="goldStyling(props.item.buyout)"></td>
              <td v-html="goldStyling(props.item.median)"></td>
              <td v-html="goldStyling(props.item.profit)"></td>
              <td>{{ Math.round(props.item.percent) }}%</td>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<style>
.copper, .silver, .gold {
  font-weight: bold;
  padding-left:2px;
  font-size: 10px;
}
.copper {
  color: #b87333;
}
.silver {
  color: silver;
}
.gold {
  color: gold;
  font-size: 16px;
}
</style>

<script>
  export default {
    computed: {
      realmIndex () { return this.$store.state.realmIndex },
      petIndex () { return this.$store.state.petIndex },
      regions () {
        return Object.keys(this.$store.state.realmIndex)
        .map(r => this.$store.state.realmIndex[r].regionTag)
        .reduce((a, v) => { if (!a.includes(v)) a.push(v); return a }, [])
      },
      realmList () {
        return Object.keys(this.$store.state.realmIndex)
        .map(r => { return {text: this.$store.state.realmIndex[r].name, value: this.$store.state.realmIndex[r].ahid, region: this.$store.state.realmIndex[r].regionTag} })
        .filter(r => { return r.region === this.region })
        .sort((a, b) => { return a.text > b.text ? 1:-1 })
      },
      listings () {
        let list = []
        this.listingsRaw.forEach(auction => {
          let petInfo = this.petIndex[auction.petSpeciesId]
          list.push(Object.assign(auction, {name: petInfo.name, image: petInfo.image}))
        })
        return list
      }
    },
    data () {
      return {
        maxBuyout: 5000,
        minProfit: 500,
        minMarkup: 50,
        region: 'US',
        ahid: 'AH3FD1C2',
        listingsRaw: [],
        pagination: {descending: true, page: 0, rowsPerPage: -1, sortBy: 'percent'},
        listingsHeadings: [
          {text: 'Image', value: 'image'},
          {text: 'Name', value: 'name'},
          {text: 'Level', value: 'petLevel'},
          {text: 'Buyout', value: 'buyout'},
          {text: 'Suggested Price', value: 'median'},
          {text: 'Profit', value: 'profit'},
          {text: 'Markup', value: 'percent'},
        ]
      }
    },
    methods: {
      async auctionListings (event) {
        this.listingsRaw = await this.$axios.$get(`http://localhost:3303/buy/${this.ahid}?maxbuyout=${this.maxBuyout * 10000}&minprofit=${this.minProfit * 10000}&minmarkup=${this.minMarkup}`)
      },
      numberWithCommas (x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      },
      goldStyling (num) {
        let str = '' + Math.round(num)
        let copper = str.substring(str.length -2, str.length)
        let silver = str.substring(str.length -4, str.length -2)
        let gold = str.substring(0, str.length -4)

        let styled = ''
        if (str.length > 4) styled += `<span class="gold">${this.numberWithCommas(gold)}</span>`
        if (str.length > 2) styled += `<span class="silver">${silver}</span>`
        styled += `<span class="copper">${copper}</span>`
        return styled
      }
    }
  }
</script>
