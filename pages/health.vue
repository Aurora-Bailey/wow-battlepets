<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8 md6>
      <div class="text-xs-center">
        <img src="/v.png" alt="Vuetify.js" class="mb-5" />
      </div>
      <v-card >
        <v-card-title class="headline">Auction House Health</v-card-title>
        <v-card-text>
          <v-select :items="regions" v-model="region" label="Region"></v-select>
          <v-data-table
            :headers="statsHeadings"
            :items="stats"
            class="elevation-1"
            :rows-per-page-items="[ 50, 100, 500 ]"
          >
            <template slot="items" slot-scope="props">
              <td>{{props.item.auctionHouse}}</td>
              <td v-html="goldStyling(props.item.marketCap)"></td>
              <td>{{props.item.volume}}</td>
              <td>{{Math.round(props.item.percentSold)}}%</td>
              <td>{{Math.round(props.item.percentExpired)}}%</td>
              <td>{{Math.round(props.item.percentCanceled)}}%</td>
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
      healthHeadings () {
        if (this.health.length > 0) return Object.keys(this.health[0]).map(head => {return {value: head, text: head}})
        else return []
      },
      statsHeadings () {
        if (this.stats.length > 0) return Object.keys(this.stats[0]).map(head => {return {value: head, text: head}})
        else return []
      },
      stats () {
        return this.health.filter(h => {
          return h.region === this.region
        }).map(h => {
          let auctionHouse = h.ah
          let marketCap = h.sold_buyout_sum + h.expired_buyout_sum + h.canceled_buyout_sum
          let volume = h.sold_num + h.expired_num + h.canceled_num
          let percentSold = (100/volume) * h.sold_num
          let percentExpired = (100/volume) * h.expired_num
          let percentCanceled = (100/volume) * h.canceled_num
          return {auctionHouse, marketCap, volume, percentSold, percentExpired, percentCanceled}
        })
      }
    },
    data () {
      return {
        region: 'US',
        regions: ['US', 'EU', 'KR', 'TW']
      }
    },
    methods: {
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
      const health = await app.$axios.$get('http://54.244.210.52:3303/health')
      return { health }
    }
  }
</script>
