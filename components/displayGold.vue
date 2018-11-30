<template>
  <span v-html="goldStyling(value)"></span>
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
  props: ['value'],
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
  }
}
</script>
