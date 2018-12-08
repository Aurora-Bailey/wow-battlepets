<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8 md6>
      <div class="text-xs-center">
        <img src="/v.png" alt="Vuetify.js" class="mb-5" />
      </div>
      <v-card>
        <v-card-title class="headline">Buy pets from realm</v-card-title>
        <v-card-text>
          <v-text-field label="Character Name" v-model="character"></v-text-field>
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
              <td><img :src="props.item.image" :title="props.item.petSpeciesId"></td>
              <td>{{ props.item.name }}</td>
              <td>{{ props.item.petLevel }}</td>
              <td><display-gold :value="props.item.buyout"></display-gold></td>
              <td><display-gold :value="props.item.median"></display-gold></td>
              <td>{{ msToTimeString(Date.now() - props.item.lastSeen) }}</td>
              <td :class="props.item.status">{{ props.item.status }}</td>
              <td>{{ props.item.timeLeft }}</td>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<style>
.live {
  color: yellow;
}
.sold {
  color: #00ff00;
}
.expired {
  color: #FF0000;
}
.canceled {
  color: orange;
}
.timeskip {
  color: blue;
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
        this.listingsRaw.forEach(item => {
          let petInfo = this.petIndex[item.petSpeciesId]
          list.push(Object.assign(item, {name: petInfo.name, image: petInfo.image}))
        })
        return list
      }
    },
    data () {
      return {
        character: 'Vitrachi',
        listingsRaw: [],
        pagination: {descending: true, page: 0, rowsPerPage: -1, sortBy: 'lastSeen'},
        listingsHeadings: [
          {text: 'Image', value: 'image'},
          {text: 'Name', value: 'name'},
          {text: 'Level', value: 'petLevel'},
          {text: 'Buyout', value: 'buyout'},
          {text: 'Suggested Price', value: 'median'},
          {text: 'Last Seen', value: 'lastSeen'},
          {text: 'Status', value: 'status'},
          {text: 'Time Left', value: 'timeLeft'}
        ]
      }
    },
    methods: {
      async requestData (event) {
        this.listingsRaw = []
        this.listingsRaw = await this.$axios.$get(`http://${this.$store.state.server}/name/${this.character}`)
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
