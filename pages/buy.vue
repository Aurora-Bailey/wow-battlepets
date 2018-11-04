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
          <v-autocomplete :items="realmList" v-model="realm" label="Realm"></v-autocomplete>
          <v-text-field label="Max Buyout (gold)" v-model="maxBuyout"></v-text-field>
          <v-text-field label="Min Margin (gold)" v-model="minMargin"></v-text-field>
          <v-text-field label="Min percent gain" v-model="minPercent"></v-text-field>
          <!-- <br>
          Region: {{region}}
          <br>
          Realm: {{realm}}
          <br>
          Auction House: {{auctionHouse}} -->
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="auctionListings">Continue</v-btn>
        </v-card-actions>
      </v-card>
      <v-card v-if="listings.length > 0" class="mt-5">
        <v-card-title class="headline">Listings</v-card-title>
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
              <td>{{ props.item.petLevel }}</td>
              <td v-html="goldStyling(props.item.buyout)"></td>
              <td v-html="goldStyling(props.item.region_sold_median)"></td>
              <td v-html="goldStyling(props.item.region_margin)"></td>
              <td>{{ Math.round(props.item.region_percent) }}%</td>
              <td>{{ props.item.region_sold_num }}</td>
              <td v-html="goldStyling(props.item.realm_sold_median)"></td>
              <td>{{ props.item.realm_sold_num }}</td>
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
      }
    },
    data () {
      return {
        maxBuyout: 5000,
        minMargin: 500,
        minPercent: 50,
        region: 'US',
        realm: 'Aggramar',
        regions: ['US', 'EU', 'KR', 'TW'],
        listings: []
      }
    },
    methods: {
      async auctionListings (event) {
        let list = await this.$axios.$get(`http://54.244.210.52:3303/buy?ah=${this.auctionHouse}&region=${this.region}&maxbuyout=${this.maxBuyout * 10000}&minmargin=${this.minMargin * 10000}&minpercent=${this.minPercent}`)
        this.listings = list.map(item => {
          let {icon, name, petLevel, buyout, region_sold_median, region_margin, region_percent, region_sold_num, realm_sold_median, realm_sold_num} = item
          return {icon, name, petLevel, buyout, region_sold_median, region_margin, region_percent, region_sold_num, realm_sold_median, realm_sold_num}
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
