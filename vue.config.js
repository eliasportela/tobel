module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        appId: "delivery.lecard.whatsapp",
        productName: "LeBot - Lecard ChatBot",
        artifactName: 'whatsapp-lecard-${version}.${ext}',
        publish: ['github'],
        win: {
          target: [
            {
              target: "nsis",
              arch: [
                "x64",
                "ia32"
              ]
            }
          ]
        }
      }
    }
  }
};
