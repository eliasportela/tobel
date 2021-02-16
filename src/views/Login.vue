<template>
  <div class="container-fluid mt-2 mb-3">
    <div class="text-center mt-5">
      <img src="../assets/logo-zap.png" class="d-inline-block" alt="Logo Lecard" style="width: 64px; border-radius: 6px">
      <h5 class="font-weight-bold mt-2">Login</h5>
    </div>
    <div class="mt-4">
      <div class="alert alert-danger alert-dismissible fade show text-center small" role="alert" v-show="msg">
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
</template>

<script>
  export default {
    name: 'Login',
    data() {
      return {
        msg: '',
        loading: false,
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

      logar() {
        if (this.loading) {
          return;
        }
        this.loading = true;

        this.$http.post('autenticar', this.dados)
          .then(res => {
            this.loading = false;

            if (res.data.success) {
              this.$emit('setConfigs', res.data);
            }

          }, res => {
            console.log(res);
            this.loading = false;
            let msg = res.data.msg;
            this.msg = msg ? msg : 'Erro temporário'
          });
      }
    }
  }
</script>
