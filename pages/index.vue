<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8 md6>
      <div class="text-xs-center">
        <img src="/v.png" alt="Vuetify.js" class="mb-5" />
      </div>
      <h1>Kai's Battle Pets</h1>
    </v-flex>
  </v-layout>
</template>
<script>
  export default {
    computed: {
      realmIndex () { return this.$store.state.realmIndex },
      petIndex () { return this.$store.state.petIndex }
    }
  }
</script>
