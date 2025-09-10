import { Amplify } from 'aws-amplify'

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'ap-south-1_XDgQomyS4',
      userPoolClientId: '76k3790rsstnd1ij4rl4n1c91u',
      region: 'ap-south-1'
    }
  }
})
