<template>
  <div id="app">
    <div v-if="!load">
      <router-view @setConfigs="setUserData"/>
    </div>
    <loading v-else/>
  </div>
</template>
<script>
  import Loading from "./components/Loading";
  const { ipcRenderer } = require('electron');
  const Config = require('electron-config');
  const config = new Config();

  export default {
    components: {Loading},
    data() {
      return {
        load: true,
        token: '',
        notification: '',
        key: ''
      }
    },

    methods: {
      autenticar() {
        this.$http.post('autenticar', {key: this.key})
          .then(res => {
            if (res.data.success) {
              this.setUserData(res.data);

            } else {
              this.load = false;
            }

          }, res => {
            this.load = false;

            if (res.status !== 401) {
              this.$swal("Não conseguimos acessar sua conexão com a internet. Por favor verifique se seu computador tem uma conexão estável.");

            } else {
              config.clear();
            }
          });
      },

      setUserData(data) {
        this.load = true;

        if (data) {
          this.key = data.token;
          this.token = data.empresa;

          localStorage.setItem("key", data.token);
          localStorage.setItem("token", data.empresa);
          config.set("key", data.token);
          config.set("token", data.empresa);
          data.base_url = config.get('homologacao') ? process.env.VUE_APP_BASE_HOMOLOGACAO : process.env.VUE_APP_BASE_SERVER;

          this.$socket.emit('empresa_connected', data.empresa);
          this.getConfigs(data, data.token);

        } else {
          this.load = false;
        }
      },

      getConfigs(data, token) {
        this.$http.get('chatbot/config/' + token)
          .then(res => {
            ipcRenderer.send('toggle-wpp', data);

            if (this.$route.name !== "Config") {
              this.$router.push('/config');
            }

            this.load = false;

            if (res.data && res.data.bandeiras) {
              res.data.bandeiras.forEach(b => {
                console.log('Empresa conectada: ' + b.token);
                this.$socket.emit('empresa_connected', b.token);
              })
            }

          }, res => {
            console.log(res);
            this.load = false;
          });
      },

      getBlocklist() {
        this.$http.get('chatbot/blocklist/' + this.key)
          .then(res => {
            ipcRenderer.send('blocklist', res.data);

          }, res => {
            console.log(res);
          });
      }
    },

    mounted() {
      localStorage.clear();
      this.key = config.get('key');
      this.token = config.get('token');

      if (this.key && this.token) {
        setTimeout(() => {
          this.autenticar();
        }, 1500)

      } else {
        this.load = false;
      }
    },

    created() {
      ipcRenderer.on('go-page', (event, arg) => {
        const url = "/" + (arg.url ? arg.url : arg);

        if (this.$route.fullPath !== url) {
          this.$router.push(url);
          this.$emit('reloadDados');
        }
      });

      ipcRenderer.on('getBlocklist', (event, arg) => {
        this.getBlocklist();
      });
    },

    sockets: {
      connect() {
        if (config.get('token')) {
          console.log('Empresa conectada: ' + config.get('token'));
          this.$socket.emit('empresa_connected', config.get('token'));
        }
      },

      request_human(data) {
        this.notification = new Notification('Solicitação de atendimento!', {
          body: (data.telefone ? 'O cliente: ' + data.telefone : 'Um cliente') + ' solicitou atendimento',
          icon: document.getElementById('imgEmpresa').src
        });

        this.notification.onclick = (event) => {
          event.preventDefault();
          ipcRenderer.send('focus');
        };

        if (audio.paused) {
          audio.play();
        }
        ipcRenderer.send('socket-event', data);
      },

      delivery_whatsapp(data) {
        ipcRenderer.send('socket-send', data);
      }
    }
  }

  ipcRenderer.on('toggle-notification', (event, arg) => {
    if (arg && audio.paused) {
      audio.play();

    } else if (!arg) {
      audio.pause();
    }
  });

</script>

<style>
  .pointer {
    cursor: pointer;
  }
</style>
