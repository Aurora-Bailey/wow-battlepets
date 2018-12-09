<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8 md6>
      <div class="text-xs-center">
        <img src="/v.png" alt="Vuetify.js" class="mb-5" />
      </div>
      <v-card>
        <v-card-title class="headline">Buy pets from many realms</v-card-title>
        <v-card-text>
          <h3>Buy options</h3>
          <v-text-field label="Maximum Buyout (gold)" v-model="maxBuyout"></v-text-field>
          <v-text-field label="Minimum Profit (gold)" v-model="minProfit"></v-text-field>
          <v-text-field label="Minimum Markup (percent)" v-model="minMarkup"></v-text-field>
          <v-radio-group label="Pet Level" row v-model="level">
            <v-radio :key="1" label="1" :value="1"></v-radio>
            <v-radio :key="25" label="25" :value="25"></v-radio>
          </v-radio-group>
          <v-checkbox label="Rare quality only" v-model="rareonly"></v-checkbox>
          <h3>Main Character</h3>
          <v-select :items="regions" v-model="region" label="Region"></v-select>
          <v-autocomplete :items="realmListID" v-model="realm" label="Realm"></v-autocomplete>
          <v-text-field label="Character Name" v-model="character"></v-text-field>
          <h3>Buy Realms</h3>
          <v-autocomplete v-for="(item, index) in buyRealms" :items="realmListAHID" v-model="item.ahid" label="Realm">
            <v-icon slot="append-outer" @click="removeBuyRealm(index)">cancel</v-icon>
          </v-autocomplete>
          <v-btn color="success" @click="addBuyRealm" small fab><v-icon>add</v-icon></v-btn>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="requestData">Continue</v-btn>
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
              <td><img :src="props.item.image" :title="props.item.petSpeciesId" :class="'quality' + props.item.petQualityId"></td>
              <td>{{ props.item.name }}</td>
              <td>{{ props.item.ahname }}</td>
              <td>{{ props.item.petLevel }}</td>
              <td><display-gold :value="props.item.buyout"></display-gold></td>
              <td><display-gold :value="props.item.median"></display-gold></td>
              <td><display-gold :value="props.item.profit"></display-gold></td>
              <td>{{ Math.round(props.item.percent) }}%</td>
              <td>{{ props.item.soldNum }}</td>
              <td><v-checkbox v-model="props.item.buy" primary hide-details></v-checkbox></td>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
      <v-card v-if="listings.length > 0" class="mt-5">
        <v-card-title class="headline">Wow commands </v-card-title>
        <v-card-text>
          <div v-for="list in listingsByRealm">
            <h2>{{list[0].ahname}}</h2>
            <br>
            <span v-for="item in list" v-if="item.buy">{{`QueryAuctionItems("${item.name}") print("${item.name} ${item.petLevel} ${item.buyout/10000}")|`}}</span>
            <br>
            <br>
          </div>
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
      realmIndex () { return this.$store.state.realmIndex },
      petIndex () { return this.$store.state.petIndex },
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
      realmListID () {
        return Object.keys(this.$store.state.realmIndex)
        .map(r => { return {text: this.$store.state.realmIndex[r].name, value: this.$store.state.realmIndex[r].id, region: this.$store.state.realmIndex[r].regionTag} })
        .filter(r => { return r.region === this.region })
        .sort((a, b) => { return a.text > b.text ? 1:-1 })
      },
      realmListAHID () {
        return Object.keys(this.$store.state.realmIndex)
        .map(r => { return {text: this.$store.state.realmIndex[r].name, value: this.$store.state.realmIndex[r].ahid, region: this.$store.state.realmIndex[r].regionTag} })
        .filter(r => { return r.region === this.region })
        .sort((a, b) => { return a.text > b.text ? 1:-1 })
      },
      buyRealmsString () { return this.buyRealms.map(r => r.ahid).filter(r => r !== '').join('-')},
      listingsByRealm () {
        let sl = {}
        this.listings
        .sort((a, b) => {
            return b.percent - a.percent
        })
        .filter(item => item.buy)
        .forEach(item => {
          if (typeof sl[item.ahid] === 'undefined') sl[item.ahid] = []
          sl[item.ahid].push(item)
        })
        return Object.keys(sl).map(index => sl[index]).sort((a,b) => {return b.length - a.length})
      },
      listings () {
        let list = []
        this.listingsRaw.forEach(item => {
          let petInfo = this.petIndex[item.petSpeciesId]
          let ahname = this.auctionHouseNameLookup[item.ahid]
          list.push(Object.assign(item, {name: petInfo.name, image: petInfo.image, ahname}))
        })
        return list
      }
    },
    data () {
      return {
        maxBuyout: 5000,
        minProfit: 500,
        minMarkup: 100,
        rareonly: true,
        level: 1,
        region: 'US',
        realm: 106,
        character: 'Napri',
        buyRealms: [],
        listingsRaw: [],
        pagination: {descending: true, page: 0, rowsPerPage: -1, sortBy: 'percent'},
        listingsHeadings: [
          {text: 'Image', value: 'image'},
          {text: 'Name', value: 'name'},
          {text: 'Realm', value: 'ahname'},
          {text: 'Level', value: 'petLevel'},
          {text: 'Buyout', value: 'buyout'},
          {text: 'Suggested Price', value: 'median'},
          {text: 'Profit', value: 'profit'},
          {text: 'Markup', value: 'percent'},
          {text: 'Sold', value: 'soldNum'},
          {text: 'Buy', value: 'buy'}
        ]
      }
    },
    methods: {
      async requestData (event) {
        this.listingsRaw = []
        this.listingsRaw = await this.$axios.$get(`http://${this.$store.state.server}/multibuy/${this.realm}/${this.character}/${this.buyRealmsString}?maxbuyout=${this.maxBuyout * 10000}&minprofit=${this.minProfit * 10000}&minmarkup=${this.minMarkup}&rareonly=${this.rareonly}&level=${this.level}`)
      },
      addBuyRealm (event) {
        this.buyRealms.push({ahid: ''})
      },
      removeBuyRealm (index) {
        this.buyRealms.splice(index, 1)
      }
    }
  }
</script>
