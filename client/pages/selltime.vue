<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8 md6>
      <div class="text-xs-center">
        <img src="/v.png" alt="Vuetify.js" class="mb-5" />
      </div>
      <v-card>
        <v-card-title class="headline">Sell Times</v-card-title>
        <v-card-text>
          <h3>Sell rate by hour</h3>
          <div v-for="timezone in dataArray">
            <h4>{{timezone.timezone}} min:{{timezone.min}} max:{{timezone.max}}</h4>
            <div class="block_container">
              <div :title="hour.humantime + ' ' + hour.sold" class="hour_block" v-for="hour in timezone.values" :style="{backgroundColor: hour.error ? `#2d0000` : `hsl(200, 100%, ${Math.round(hour.p * 100)}%)`}">
                <div class="hour_tooltip">
                  {{hour.humantime}} Sold:{{hour.sold}}
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<style>
.block_container {
  width: 600px;
}
.hour_block {
  display: inline-block;
  width: 25px;
  height: 25px;
  padding: 0;
  margin: 0;
  outline: 1px solid black;
  margin-bottom: -5px;
  position: relative;
  cursor: pointer
}
.hour_tooltip {
  position: absolute;
  top: -80px;
  right: -15px;
  background-color: black;
  color: white;
  padding: 15px;
  display: none;
  z-index: 1000;
  pointer-events: none;
  opacity: 0.7;
}
.hour_block:hover .hour_tooltip {
  display: block;
}
</style>

<script>
  let daysOfTheWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  export default {
    computed: {
      dataArray () {
        console.log(this.data)
        this.data["UnitedStates"] = mergeTimezones(mergeTimezones(this.data["America/Chicago"], this.data["America/Denver"]),mergeTimezones(this.data["America/New_York"], this.data["America/Los_Angeles"]))
        return Object.keys(this.data).map(index => {
          let values = Object.keys(this.data[index]).map(key => {
            let timestamp = parseInt(key) * (1000*60*60)
            let date = new Date(timestamp)
            let humantime = `${daysOfTheWeek[date.getDay()]}@${date.getHours()}`
            return {h: key, hour: date.getHours(), day: date.getDay(), humantime, sold: this.data[index][key]}
          })
          let min = values.reduce((a, v) => {
            if (v.sold < a) a = v.sold
            return a
          }, 100000)
          let max = values.reduce((a, v) => {
            if (v.sold > a) a = v.sold
            return a
          }, 0)
          values = values.map(item => {
            item.p = item.sold / max
            return item
          })
          // fill in blank spots
          values = values.reduce((a, v) => {
            let l = a.length
            if (l === 0) {
              let firstHour = parseInt(v.hour)
              while (firstHour > 0) {
                a.push({h: 0, humantime: 'notfound!', error: true, sold: 0, p: 0})
                firstHour--
              }
              a.push(v)
              return a
            }
            let lastItem = a[l - 1]
            let lastIndex = parseInt(lastItem.h)

            while (lastIndex + 1 < parseInt(v.h)) {
              a.push({h: lastIndex, humantime: 'notfound!', error: true, sold: 0, p: 0})
              lastIndex++
            }

            a.push(v)
            return a
          }, [])
          // return object
          return {timezone: index, min, max, values}
        })
      }
    },
    data () {
      return {
        autoMatch: 1
      }
    },
    async asyncData ({ params, $axios, store }) {
      let { data } = await $axios.get(`http://${process.server ? store.state.server.replace(store.state.publicIp, 'localhost') : store.state.server}/selltime`)
      return { data }
    }
  }

  function mergeTimezones (timezoneA, timezoneB) {
    let timezoneC = {}
    Object.keys(timezoneA).forEach(key => {
      if (typeof timezoneC[key] === 'undefined') timezoneC[key] = 0
      timezoneC[key] += timezoneA[key]
    })
    Object.keys(timezoneB).forEach(key => {
      if (typeof timezoneC[key] === 'undefined') timezoneC[key] = 0
      timezoneC[key] += timezoneB[key]
    })
    return timezoneC
  }
</script>
