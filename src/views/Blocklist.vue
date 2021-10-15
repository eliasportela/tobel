<template>
  <div class="container-fluid mt-0 mb-4">
    <div v-if="!load">
      <div class="d-flex justify-content-between py-3 border-bottom mb-3">
        <div>
          <router-link to="config" class="menu text-decoration-none">Configs</router-link>
          <router-link to="blocklist" class="menu text-decoration-none active">Blocklist</router-link>
        </div>
        <button class="btn btn-sm btn-success" @click="getUsers()">Atualizar</button>
      </div>
      <div class="px-2">
        <h6 class="small">Clientes adicionados em sua blocklist</h6>
        <table class="table border">
          <tr v-for="u in users">
            <td class="align-middle">
              {{u.nome_user ? u.nome_user : u.telefone}}
            </td>
            <td class="text-center">
              <a href="javascript:" class="text-decoration-none m-0 h5 text-success" @click="removerUser(u)">&times;</a>
            </td>
          </tr>
        </table>
      </div>
    </div>
    <div class="d-flex justify-content-center" style="height: 400px" v-else>
      <div class="m-auto text-center">
        <img src="../assets/logo-zap.png" class="d-inline-block animated flipInY infinite" alt="Logo Lecard"
             style="width: 64px; border-radius: 6px">
        <div class="small mt-2 text-secondary">Carregando dados..</div>
      </div>
    </div>
  </div>
</template>

<script>
  const Config = require('electron-config');
  const config = new Config();

  export default {
    name: 'Blocklist',

    data() {
      return {
        token: '',
        load: true,
        users: []
      }
    },

    methods: {
      getUsers() {
        this.load = true;
        this.$http.get('chatbot/blocklist/' + this.token)
          .then(res => {
            this.users = res.data;
            this.load = false;

          }, res => {
            console.log(res);
            this.load = false;
          });
      },

      removerUser(u) {
        this.$http.post('chatbot/blocklist/remover/' + this.token, u)
          .then(res => {
            this.load = false;
            this.users = this.users.filter(user => user !== u);

          }, res => {
            console.log(res);
            this.load = false;
          });
      },
    },

    mounted() {
      this.token = config.get('key');
      this.getUsers();
    }
  }
</script>
