<template>
  <div>
    <div class="p-5">
      <div class="text-center">
        <img src="../assets/logo-zap.png" style="width: 90px; border-radius: 12px">
        <h4 class="text-secondary font-weight-bold mt-5">LeBot - Integrador Whatsapp</h4>
      </div>
      <div class="mt-4" style="width: 400px; margin: auto">
        <div>
          <div class="alert alert-danger alert-dismissible fade show text-center" role="alert" v-show="msg">
            {{msg}}
          </div>
          <form @submit.prevent="logar()">
            <div>
              <input type="email" id="usuario" v-model="dados.email" class="form-control mb-3" placeholder="E-mail" minlength="4" required>
            </div>
            <div>
              <input type="password" id="inputSenha" v-model="dados.senha" class="form-control mb-3" placeholder="Senha" minlength="6" required>
            </div>
            <div class="form-group">
              <div class="custom-control custom-checkbox">
                  <input type="checkbox" class="custom-control-input" id="checkboxSenha" @change="mostrarSenha()">
                  <label class="custom-control-label" for="checkboxSenha">Exibir senha</label>
              </div>
            </div>
            <button class="btn btn-secondary btn-block" :disabled="loading">{{loading ? 'Aguarde' : 'Login'}}</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const { ipcRenderer } = require('electron');

export default {
  name: 'Login',
  data() {
    return {
      urlBase: '',
      token: '',
      msg: '',
      loading: true,
      dados: {
        email: '',
        senha: ''
      }
    }
  },
  methods: {
    mostrarSenha() {
      const input = document.getElementById("inputSenha");
      if (input.type === "password") {
        input.type = "text";
      } else {
        input.type = "password";
      }
    },

    logar(key) {
      const dados = key ? {key} : this.dados
      this.$http.post('autenticar', dados)
        .then(res => {
          this.loading = false;
          if (res.data.success) {
            this.setUserData(res.data);
            ipcRenderer.send('login-lecard', res.data);
          }

        }, res => {
          console.log(res);
          this.loading = false;
          let msg = res.data.msg;

          if (res.status === 401) {
            this.msg = msg;
            this.dados.senha = '';
          } else {
            alert(msg ? msg : 'Erro temporário');
          }
        });
    },

    setUserData(data) {
      localStorage.setItem("key", data.token);
    }
  },

  created() {
    const key = localStorage.getItem('key');
    if (key) {
      this.logar(key)
    } else {
      this.loading = false
    }
  }
}
</script>
