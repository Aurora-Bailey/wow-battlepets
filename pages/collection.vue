<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8 md6>
      <div class="text-xs-center">
        <img src="/v.png" alt="Vuetify.js" class="mb-5" />
      </div>
      <v-card>
        <v-card-title class="headline">Sell Battle Pets</v-card-title>
        <v-card-text>
          <v-select :items="regions" v-model="region" label="Region"></v-select>
          <v-autocomplete :items="realmList" v-model="realm" label="Realm"></v-autocomplete>
          <v-text-field label="Character Name" v-model="characterName"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="submitData">Continue</v-btn>
        </v-card-actions>
      </v-card>
      <v-card v-if="listings.length > 0" class="mt-5">
        <v-card-title class="headline">Listings <v-spacer></v-spacer> <span class="pr-5" v-html="goldStyling(totalValue)"></span></v-card-title>
        <v-card-text>
          <v-data-table
            :headers="listingsHeadings"
            :items="listings"
            class="elevation-1"
            :rows-per-page-items="[ 50, 100, 500 ]"
          >
            <template slot="items" slot-scope="props">
              <td><img :src="props.item.icon"></td>
              <td>{{ props.item.name }}</td>
              <td>{{ props.item.speciesId }}</td>
              <td>{{ props.item.breedId }}</td>
              <td>{{ props.item.level }}</td>
              <td>{{ props.item.guid }}</td>
              <td>{{ props.item.sold_num }}</td>
              <td v-html="goldStyling(props.item.sold_median)"></td>
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
      realmList () {
        return this.realms.filter(realm => {return realm.region === this.region}).map(realm => {return realm.name}).sort()
      },
      auctionSlug () {
        let slugList = {}
        this.realms.forEach(rlm => {
          if (rlm.region === this.region)slugList[rlm.name] = rlm.auction_slug
        })
        return slugList
      },
      auctionHouse () {
        return this.auctionSlug[this.realm]
      },
      listingsHeadings () {
        if (this.listings.length > 0) return Object.keys(this.listings[0]).map(head => {return {value: head, text: head}})
        else return []
      },
      totalValue () {
        return this.listings.reduce((a, b) => { return a + b.sold_median}, 0)
      }
    },
    data () {
      return {
        characterName: 'Napri',
        region: 'US',
        realm: 'Aggramar',
        regions: ['US', 'EU', 'KR', 'TW'],
        listings: []
      }
    },
    methods: {
      async submitData (event) {
        console.log('asdf')
        let list = await this.$axios.$get(`http://54.244.210.52:3303/collection?region=${this.region}&realm=${this.realm}&character=${this.characterName}`)
        this.listings = list.map(li => {
          let {icon, name, speciesId, breedId, level, guid, sold_num, sold_median} = li
          return {icon, name, speciesId, breedId, level, guid, sold_num, sold_median}
        })
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
    },
    async asyncData({ app }) {
      const realms = await app.$axios.$get('http://54.244.210.52:3303/realms')
      return { realms }
    }
  }
</script>
