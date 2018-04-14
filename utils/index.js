function formatNumber (num) {
  return num > 9 ? num : `0${num}`
}

function formatCurrentTime () {
  let time = new Date()
  return `${
    time.getFullYear()
  }-${
    formatNumber(time.getMonth() + 1)
  }-${
    formatNumber(time.getDate())
  }_${
    formatNumber(time.getHours())
  }:${
    formatNumber(time.getMinutes())
  }:${
    formatNumber(time.getSeconds())
  }`
}

module.exports = {
  formatCurrentTime
}
