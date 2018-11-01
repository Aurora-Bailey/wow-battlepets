const MongoDB = require('./mongodb.js')
const wow_battlepets = new MongoDB('wow_battlepets')
const DriftlessInterval = require('./driftlessinterval')
const chalk = require('chalk')

class Average {
  constructor () {
    this.timezoneOffset = 6
  }

  async start () {
    // Load last 7 days
    let db = await wow_battlepets.getDB()
    let sold = await db.collection('auctions_sold').find({last_seen: {$gte: Date.now() - (1000*60*60*24*7)}}, {projection: {_id: 0, buyout: 1, petSpeciesId: 1, petLevel: 1, region: 1, auction_house: 1, last_seen: 1}}).toArray()
    let expired = await db.collection('auctions_expired').find({last_seen: {$gte: Date.now() - (1000*60*60*24*7)}}, {projection: {_id: 0, buyout: 1, petSpeciesId: 1, petLevel: 1, region: 1, auction_house: 1, last_seen: 1}}).toArray()
    let canceled = await db.collection('auctions_canceled').find({last_seen: {$gte: Date.now() - (1000*60*60*24*7)}}, {projection: {_id: 0, buyout: 1, petSpeciesId: 1, petLevel: 1, region: 1, auction_house: 1, last_seen: 1}}).toArray()

    // Split data into realms
    let soldSplitToRealm = {}
    let expiredSplitToRealm = {}
    let canceledSplitToRealm = {}

    sold.forEach(pet => {
      if (pet.petLevel !== 1 && pet.petLevel !== 25) return false
      if (pet.buyout < 100) return false
      if (typeof soldSplitToRealm[pet.region] === 'undefined') soldSplitToRealm[pet.region] = {}
      if (typeof soldSplitToRealm[pet.region][pet.auction_house] === 'undefined') soldSplitToRealm[pet.region][pet.auction_house] = {}
      if (typeof soldSplitToRealm[pet.region][pet.auction_house][pet.petSpeciesId] === 'undefined') soldSplitToRealm[pet.region][pet.auction_house][pet.petSpeciesId] = {}
      if (typeof soldSplitToRealm[pet.region][pet.auction_house][pet.petSpeciesId][pet.petLevel] === 'undefined') soldSplitToRealm[pet.region][pet.auction_house][pet.petSpeciesId][pet.petLevel] = []
      soldSplitToRealm[pet.region][pet.auction_house][pet.petSpeciesId][pet.petLevel].push(pet)
    })
    expired.forEach(pet => {
      if (pet.petLevel !== 1 && pet.petLevel !== 25) return false
      if (pet.buyout < 100) return false
      if (typeof expiredSplitToRealm[pet.region] === 'undefined') expiredSplitToRealm[pet.region] = {}
      if (typeof expiredSplitToRealm[pet.region][pet.auction_house] === 'undefined') expiredSplitToRealm[pet.region][pet.auction_house] = {}
      if (typeof expiredSplitToRealm[pet.region][pet.auction_house][pet.petSpeciesId] === 'undefined') expiredSplitToRealm[pet.region][pet.auction_house][pet.petSpeciesId] = {}
      if (typeof expiredSplitToRealm[pet.region][pet.auction_house][pet.petSpeciesId][pet.petLevel] === 'undefined') expiredSplitToRealm[pet.region][pet.auction_house][pet.petSpeciesId][pet.petLevel] = []
      expiredSplitToRealm[pet.region][pet.auction_house][pet.petSpeciesId][pet.petLevel].push(pet)
    })
    canceled.forEach(pet => {
      if (pet.petLevel !== 1 && pet.petLevel !== 25) return false
      if (pet.buyout < 100) return false
      if (typeof canceledSplitToRealm[pet.region] === 'undefined') canceledSplitToRealm[pet.region] = {}
      if (typeof canceledSplitToRealm[pet.region][pet.auction_house] === 'undefined') canceledSplitToRealm[pet.region][pet.auction_house] = {}
      if (typeof canceledSplitToRealm[pet.region][pet.auction_house][pet.petSpeciesId] === 'undefined') canceledSplitToRealm[pet.region][pet.auction_house][pet.petSpeciesId] = {}
      if (typeof canceledSplitToRealm[pet.region][pet.auction_house][pet.petSpeciesId][pet.petLevel] === 'undefined') canceledSplitToRealm[pet.region][pet.auction_house][pet.petSpeciesId][pet.petLevel] = []
      canceledSplitToRealm[pet.region][pet.auction_house][pet.petSpeciesId][pet.petLevel].push(pet)
    })

    // split data into regions
    let soldSplitToRegion = {}
    let expiredSplitToRegion = {}
    let canceledSplitToRegion = {}

    sold.forEach(pet => {
      if (pet.petLevel !== 1 && pet.petLevel !== 25) return false
      if (pet.buyout < 100) return false
      if (typeof soldSplitToRegion[pet.region] === 'undefined') soldSplitToRegion[pet.region] = {}
      if (typeof soldSplitToRegion[pet.region][pet.petSpeciesId] === 'undefined') soldSplitToRegion[pet.region][pet.petSpeciesId] = {}
      if (typeof soldSplitToRegion[pet.region][pet.petSpeciesId][pet.petLevel] === 'undefined') soldSplitToRegion[pet.region][pet.petSpeciesId][pet.petLevel] = []
      soldSplitToRegion[pet.region][pet.petSpeciesId][pet.petLevel].push(pet)
    })
    expired.forEach(pet => {
      if (pet.petLevel !== 1 && pet.petLevel !== 25) return false
      if (pet.buyout < 100) return false
      if (typeof expiredSplitToRegion[pet.region] === 'undefined') expiredSplitToRegion[pet.region] = {}
      if (typeof expiredSplitToRegion[pet.region][pet.petSpeciesId] === 'undefined') expiredSplitToRegion[pet.region][pet.petSpeciesId] = {}
      if (typeof expiredSplitToRegion[pet.region][pet.petSpeciesId][pet.petLevel] === 'undefined') expiredSplitToRegion[pet.region][pet.petSpeciesId][pet.petLevel] = []
      expiredSplitToRegion[pet.region][pet.petSpeciesId][pet.petLevel].push(pet)
    })
    canceled.forEach(pet => {
      if (pet.petLevel !== 1 && pet.petLevel !== 25) return false
      if (pet.buyout < 100) return false
      if (typeof canceledSplitToRegion[pet.region] === 'undefined') canceledSplitToRegion[pet.region] = {}
      if (typeof canceledSplitToRegion[pet.region][pet.petSpeciesId] === 'undefined') canceledSplitToRegion[pet.region][pet.petSpeciesId] = {}
      if (typeof canceledSplitToRegion[pet.region][pet.petSpeciesId][pet.petLevel] === 'undefined') canceledSplitToRegion[pet.region][pet.petSpeciesId][pet.petLevel] = []
      canceledSplitToRegion[pet.region][pet.petSpeciesId][pet.petLevel].push(pet)
    })

    // Build averages
    let buildAverages = {}
    Object.keys(soldSplitToRealm).forEach(region => {
      Object.keys(soldSplitToRealm[region]).forEach(house => {
        Object.keys(soldSplitToRealm[region][house]).forEach(species => {
          Object.keys(soldSplitToRealm[region][house][species]).forEach(level => {
            // framework
            if (typeof buildAverages[region] === 'undefined') buildAverages[region] = {}
            if (typeof buildAverages[region][house] === 'undefined') buildAverages[region][house] = {}
            if (typeof buildAverages[region][house][species] === 'undefined') buildAverages[region][house][species] = {}
            if (typeof buildAverages[region][house][species][level] === 'undefined') buildAverages[region][house][species][level] = {}

            // sort
            let buyoutArray = soldSplitToRealm[region][house][species][level].map(pet => {return pet.buyout})
            buyoutArray.sort((a, b) => {return a - b})
            buildAverages[region][house][species][level]['sold_mean'] = buyoutArray.reduce((a, b) => {return a+b}) / buyoutArray.length
            buildAverages[region][house][species][level]['sold_median'] = buyoutArray[Math.floor(buyoutArray.length / 2)]
            buildAverages[region][house][species][level]['sold_low'] = buyoutArray[0]
            buildAverages[region][house][species][level]['sold_high'] = buyoutArray[buyoutArray.length -1]
            buildAverages[region][house][species][level]['sold_num'] = buyoutArray.length
          })
        })
      })
    })
    Object.keys(expiredSplitToRealm).forEach(region => {
      Object.keys(expiredSplitToRealm[region]).forEach(house => {
        Object.keys(expiredSplitToRealm[region][house]).forEach(species => {
          Object.keys(expiredSplitToRealm[region][house][species]).forEach(level => {
            // framework
            if (typeof buildAverages[region] === 'undefined') buildAverages[region] = {}
            if (typeof buildAverages[region][house] === 'undefined') buildAverages[region][house] = {}
            if (typeof buildAverages[region][house][species] === 'undefined') buildAverages[region][house][species] = {}
            if (typeof buildAverages[region][house][species][level] === 'undefined') buildAverages[region][house][species][level] = {}

            // sort
            let buyoutArray = expiredSplitToRealm[region][house][species][level].map(pet => {return pet.buyout})
            buyoutArray.sort((a, b) => {return a - b})
            buildAverages[region][house][species][level]['expired_mean'] = buyoutArray.reduce((a, b) => {return a+b}) / buyoutArray.length
            buildAverages[region][house][species][level]['expired_median'] = buyoutArray[Math.floor(buyoutArray.length / 2)]
            buildAverages[region][house][species][level]['expired_low'] = buyoutArray[0]
            buildAverages[region][house][species][level]['expired_high'] = buyoutArray[buyoutArray.length -1]
            buildAverages[region][house][species][level]['expired_num'] = buyoutArray.length
          })
        })
      })
    })
    Object.keys(canceledSplitToRealm).forEach(region => {
      Object.keys(canceledSplitToRealm[region]).forEach(house => {
        Object.keys(canceledSplitToRealm[region][house]).forEach(species => {
          Object.keys(canceledSplitToRealm[region][house][species]).forEach(level => {
            // framework
            if (typeof buildAverages[region] === 'undefined') buildAverages[region] = {}
            if (typeof buildAverages[region][house] === 'undefined') buildAverages[region][house] = {}
            if (typeof buildAverages[region][house][species] === 'undefined') buildAverages[region][house][species] = {}
            if (typeof buildAverages[region][house][species][level] === 'undefined') buildAverages[region][house][species][level] = {}

            // sort
            let buyoutArray = canceledSplitToRealm[region][house][species][level].map(pet => {return pet.buyout})
            buyoutArray.sort((a, b) => {return a - b})
            buildAverages[region][house][species][level]['canceled_mean'] = buyoutArray.reduce((a, b) => {return a+b}) / buyoutArray.length
            buildAverages[region][house][species][level]['canceled_median'] = buyoutArray[Math.floor(buyoutArray.length / 2)]
            buildAverages[region][house][species][level]['canceled_low'] = buyoutArray[0]
            buildAverages[region][house][species][level]['canceled_high'] = buyoutArray[buyoutArray.length -1]
            buildAverages[region][house][species][level]['canceled_num'] = buyoutArray.length
          })
        })
      })
    })

    // build region averages
    let buildAveragesRegion = {}
    Object.keys(soldSplitToRegion).forEach(region => {
      Object.keys(soldSplitToRegion[region]).forEach(species => {
        Object.keys(soldSplitToRegion[region][species]).forEach(level => {
          // framework
          if (typeof buildAveragesRegion[region] === 'undefined') buildAveragesRegion[region] = {}
          if (typeof buildAveragesRegion[region][species] === 'undefined') buildAveragesRegion[region][species] = {}
          if (typeof buildAveragesRegion[region][species][level] === 'undefined') buildAveragesRegion[region][species][level] = {}

          // sort
          let buyoutArray = soldSplitToRegion[region][species][level].map(pet => {return pet.buyout})
          buyoutArray.sort((a, b) => {return a - b})
          buildAveragesRegion[region][species][level]['sold_mean'] = buyoutArray.reduce((a, b) => {return a+b}) / buyoutArray.length
          buildAveragesRegion[region][species][level]['sold_median'] = buyoutArray[Math.floor(buyoutArray.length / 2)]
          buildAveragesRegion[region][species][level]['sold_low'] = buyoutArray[0]
          buildAveragesRegion[region][species][level]['sold_high'] = buyoutArray[buyoutArray.length -1]
          buildAveragesRegion[region][species][level]['sold_num'] = buyoutArray.length
        })
      })
    })
    Object.keys(expiredSplitToRegion).forEach(region => {
      Object.keys(expiredSplitToRegion[region]).forEach(species => {
        Object.keys(expiredSplitToRegion[region][species]).forEach(level => {
          // framework
          if (typeof buildAveragesRegion[region] === 'undefined') buildAveragesRegion[region] = {}
          if (typeof buildAveragesRegion[region][species] === 'undefined') buildAveragesRegion[region][species] = {}
          if (typeof buildAveragesRegion[region][species][level] === 'undefined') buildAveragesRegion[region][species][level] = {}

          // sort
          let buyoutArray = expiredSplitToRegion[region][species][level].map(pet => {return pet.buyout})
          buyoutArray.sort((a, b) => {return a - b})
          buildAveragesRegion[region][species][level]['expired_mean'] = buyoutArray.reduce((a, b) => {return a+b}) / buyoutArray.length
          buildAveragesRegion[region][species][level]['expired_median'] = buyoutArray[Math.floor(buyoutArray.length / 2)]
          buildAveragesRegion[region][species][level]['expired_low'] = buyoutArray[0]
          buildAveragesRegion[region][species][level]['expired_high'] = buyoutArray[buyoutArray.length -1]
          buildAveragesRegion[region][species][level]['expired_num'] = buyoutArray.length
        })
      })
    })
    Object.keys(canceledSplitToRegion).forEach(region => {
      Object.keys(canceledSplitToRegion[region]).forEach(species => {
        Object.keys(canceledSplitToRegion[region][species]).forEach(level => {
          // framework
          if (typeof buildAveragesRegion[region] === 'undefined') buildAveragesRegion[region] = {}
          if (typeof buildAveragesRegion[region][species] === 'undefined') buildAveragesRegion[region][species] = {}
          if (typeof buildAveragesRegion[region][species][level] === 'undefined') buildAveragesRegion[region][species][level] = {}

          // sort
          let buyoutArray = canceledSplitToRegion[region][species][level].map(pet => {return pet.buyout})
          buyoutArray.sort((a, b) => {return a - b})
          buildAveragesRegion[region][species][level]['canceled_mean'] = buyoutArray.reduce((a, b) => {return a+b}) / buyoutArray.length
          buildAveragesRegion[region][species][level]['canceled_median'] = buyoutArray[Math.floor(buyoutArray.length / 2)]
          buildAveragesRegion[region][species][level]['canceled_low'] = buyoutArray[0]
          buildAveragesRegion[region][species][level]['canceled_high'] = buyoutArray[buyoutArray.length -1]
          buildAveragesRegion[region][species][level]['canceled_num'] = buyoutArray.length
        })
      })
    })

    Object.keys(buildAverages).forEach(region => {
      Object.keys(buildAverages[region]).forEach(realm => {
        db.collection('average_realm').updateOne({realm: realm + '-' + region}, {$set: {realm: realm + '-' + region, age: Date.now(), data: buildAverages[region][realm]}}, {upsert: true}).then(() => {console.log('done ' + realm)})
      })
    })
    Object.keys(buildAveragesRegion).forEach(region => {
      db.collection('average_region').updateOne({region: region}, {$set: {region: region, age: Date.now(), data: buildAveragesRegion[region]}}, {upsert: true}).then(() => {console.log('done ' + region)})
    })
  }

  getStartTomorrowTimestamp () {
    return this.getStartTodayTimestamp() + (1000*60*60*24)
  }

  getStartTodayTimestamp () {
    let now = Date.now()
    let extra = now % (1000*60*60*24)
    let dayStart = now - extra + (this.timezoneOffset*60*60*1000)
    return dayStart
  }
}

let average = new Average()
average.start().catch(console.error)
