<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8 md6>
      <div class="text-xs-center">
        <img src="/v.png" alt="Vuetify.js" class="mb-5" />
      </div>
      <v-card>
        <v-card-title class="headline">Simulate selling your collection</v-card-title>
        <v-card-text>
          <v-select :items="regions" v-model="region" label="Region"></v-select>
          <v-autocomplete :items="realmList" v-model="realm" label="Realm"></v-autocomplete>
          <v-text-field label="Character Name" v-model="character"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="requestData">Continue</v-btn>
        </v-card-actions>
      </v-card>
      <v-card v-if="listings.length > 0" class="mt-5">
        <v-card-title class="headline">Your collection <v-spacer></v-spacer> <display-gold :value="listingsValue"></display-gold></v-card-title>
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
              <td>{{ props.item.sold }}</td>
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
      realmIndex () { return this.$store.state.realmIndex },
      petIndex () { return this.$store.state.petIndex },
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
      listings () {
        let list = []
        this.listingsRaw
        .filter(item => { return typeof this.petIndex[item.psid] !== 'undefined'})
        .forEach(item => {
          let petInfo = this.petIndex[item.psid]
          list.push(Object.assign(item, {name: petInfo.name, image: petInfo.image}))
        })
        return list
      },
      listingsValue () {
        return this.listingsRaw.reduce((a,v) => { return a + v.price}, 0)
      }
    },
    data () {
      return {
        region: 'US',
        realm: 106,
        character: 'Napri',
        listingsRaw: [],
        pagination: {descending: false, page: 0, rowsPerPage: -1, sortBy: 'name'},
        listingsHeadings: [
          {text: 'Image', value: 'image'},
          {text: 'Name', value: 'name'},
          {text: 'Level', value: 'level'},
          {text: 'Price', value: 'price'},
          {text: 'Sold', value: 'sold'}
        ]
      }
    },
    methods: {
      async requestData (event) {
        this.listingsRaw = []
        this.listingsRaw = await this.$axios.$get(`http://${this.$store.state.server}/collection/${this.realm}/${this.character}`)
      }
    }
  }
</script>
