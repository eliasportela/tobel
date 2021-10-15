<template>
  <div class="modal-menu mb-3" v-if="menus">
    <div class="modal-menu__item"
         :class="{'modal-menu__item--selected': (index + 1) === selected}"
         v-for="(m, index) in menus" v-show="m.active">
      <a class="text-muted text-decoration-none" href="javascript:" @click="change(index + 1)">{{m.nome}}</a>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'ModalMenu',
    props: ['menus','selected'],
    methods: {
      change(index) {
        this.$emit('changeMenu', index)
      }
    }
  }
</script>
<style>
  .modal-menu {
    border-bottom: 1px solid #ccc;
  }

  .modal-menu__item {
    display: inline-block;
    margin-right: 26px;
    padding: 0;
    text-align: center;
    font-size: 16px;
    margin-bottom: 12px;
  }

  .modal-menu__item--selected {
    border-bottom: 1px solid;
    border-color: #28a745;
    font-weight: bold;
  }

  .modal-menu__item--selected a {
    color: #28a745!important;
  }
</style>
