<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8 md6>
      <div class="text-xs-center">
        <img src="/v.png" alt="Vuetify.js" class="mb-5" />
      </div>
      <v-card>
        <v-card-title class="headline">Sell your collection</v-card-title>
        <v-card-text>
          <h3>Main Character</h3>
          <v-select :items="regions" v-model="region" label="Region"></v-select>
          <v-autocomplete :items="realmListID" v-model="realm" label="Realm"></v-autocomplete>
          <v-text-field label="Character Name" v-model="character"></v-text-field>
          <h3>Sell Realms</h3>
          <v-autocomplete v-for="item in sellRealms" :items="realmListAHID" v-model="item.ahid" label="Realm"></v-autocomplete>
          <v-btn color="success" @click="addSellRealm" small fab><v-icon>add</v-icon></v-btn>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="requestData">Continue</v-btn>
        </v-card-actions>
      </v-card>
      <v-card v-if="listings.length > 0" class="mt-5">
        <v-card-title class="headline">Sell collection </v-card-title>
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
              <td><img :src="props.item.image" :class="'quality' + props.item.quality"></td>
              <td>{{ props.item.name }}</td>
              <td>{{ props.item.level }}</td>
              <td><display-gold :value="props.item.price"></display-gold></td>
              <td style="cursor: pointer" @click="props.item.sellIndex = (props.item.sellIndex + 1) % props.item.sellAt.length">{{ props.item.ahname }}</td>
              <td :style="{color: props.item.undercut ? '#00FF00':'#FF0000'}">{{ props.item.undercut }}</td>
              <td><display-gold :value="props.item.competition"></display-gold></td>
              <td><v-checkbox v-model="props.item.selected" primary hide-details></v-checkbox></td>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
      <v-card v-if="listings.length > 0" class="mt-5">
        <v-card-title class="headline">Wow commands </v-card-title>
        <v-card-text>
          <!-- PickupContainerItem(0, 1) ClickAuctionSellItemButton() ClearCursor() PostAuction(100000, 150000, 2, 1, 1) -->
          <div v-for="ah in sellListings"><h2>{{ah[0].ahname}}:{{ah.length}}</h2 <br><span v-for="item in ah">{{`C_PetJournal.CagePetByID('BattlePet-0-${item.guid}')|PickupContainerItem(0, 1) ClickAuctionSellItemButton() ClearCursor() PostAuction(${item.price}, ${item.price}, 3) `}}</span><br><br></div>
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
      sellRealmsString () { return this.sellRealms.map(r => r.ahid).filter(r => r !== '').join('-')},
      listings () {
        let list = []
        this.listingsRaw
        .filter(item => { return typeof this.petIndex[item.psid] !== 'undefined'})
        .forEach(item => {
          let petInfo = this.petIndex[item.psid]
          item.sellAt.forEach(sa => {
            sa.ahname = this.auctionHouseNameLookup[sa.ahid]
          })
          if (item.match) {
            item.buyout = petinfo.sellAt[item.sellIndex].competition - 1
          }
          list.push(Object.assign(item, {name: petInfo.name, image: petInfo.image}, item.sellAt[item.sellIndex]))
        })
        return list
      },
      sellListings () {
        let sl = {}
        this.listings
        .filter(item => item.selected)
        .forEach(item => {
          if (typeof sl[item.ahid] === 'undefined') sl[item.ahid] = []
          sl[item.ahid].push(item)
        })
        return Object.keys(sl).map(index => sl[index]).sort((a,b) => {return b.length - a.length})
      }
    },
    data () {
      return {
        region: 'US',
        realm: 106,
        character: 'Napri',
        sellRealms: [],
        listingsRaw: [],
        pagination: {descending: false, page: 0, rowsPerPage: -1, sortBy: 'name'},
        listingsHeadings: [
          {text: 'Image', value: 'image'},
          {text: 'Name', value: 'name'},
          {text: 'Level', value: 'level'},
          {text: 'Price', value: 'price'},
          {text: 'Realm', value: 'ahname'},
          {text: 'Can Undercut', value: 'undercut'},
          {text: 'Competition', value: 'competition'},
          {text: 'Sell', value: 'selected'},
          {text: 'Match', value: 'match'},
        ]
      }
    },
    methods: {
      async requestData (event) {
        this.listingsRaw = []
        this.listingsRaw = await this.$axios.$get(`http://${this.$store.state.server}/sell/${this.realm}/${this.character}/${this.sellRealmsString}`)
      },
      addSellRealm (event) {
        this.sellRealms.push({ahid: ''})
      }
    }
  }
</script>
