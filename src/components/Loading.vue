<template>
  <div class="text-center fullscrean">
    <div class="mb-4">
      <img src="../assets/logo-zap.png" alt="Logo Lecard" style="width: 64px; border-radius: 6px">
    </div>
    <div class="dot-flashing"></div>
    <div class="text-muted font-weight-bold small mt-3" v-show="text">
      {{text !== true ? text : 'Carregando os dados'}}
    </div>
  </div>
</template>

<script>
  export default {
    name: "Loading",
    props: ['fullscrean', 'text']
  }
</script>

<style scoped>
  .fullscrean {
    position: absolute;
    top: 33%;
    left: 50%;
    transform: translateX(-50%);
  }

  .dot-flashing {
    margin: auto;
    position: relative;
    width: 10px;
    height: 10px;
    border-radius: 5px;
    background-color: #28a745;
    color: #28a745;
    animation: dotFlashing 1s infinite linear alternate;
    animation-delay: .5s;
  }

  .dot-flashing::before, .dot-flashing::after {
    content: '';
    display: inline-block;
    position: absolute;
    top: 0;
  }

  .dot-flashing::before {
    left: -15px;
    width: 10px;
    height: 10px;
    border-radius: 5px;
    background-color: #28a745;
    color: #28a745;
    animation: dotFlashing 1s infinite alternate;
    animation-delay: 0s;
  }

  .dot-flashing::after {
    left: 15px;
    width: 10px;
    height: 10px;
    border-radius: 5px;
    background-color: #28a745;
    color: #28a745;
    animation: dotFlashing 1s infinite alternate;
    animation-delay: 1s;
  }

  @keyframes dotFlashing {
    0% {
      background-color: #28a745;
    }
    50%,
    100% {
      background-color: #ebe6ff;
    }
  }

</style>
