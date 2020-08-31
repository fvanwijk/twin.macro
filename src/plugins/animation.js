export default properties => {
  const {
    theme,
    match,
    getConfigValue,
    errors: { errorSuggestions },
    pieces: { important },
  } = properties
  const classValue = match(/(?<=(animate)-)([^]*)/)
  const configValue = config => getConfigValue(theme(config), classValue)

  const animationConfig = configValue('animation')

  if (!animationConfig) {
    errorSuggestions({ config: ['animation'] })
  }

  const keyframes = {
    spin: {
      '@keyframes spin': {
        from: {
          transform: 'rotate(0deg)',
        },
        to: {
          transform: 'rotate(360deg)',
        },
      },
    },
    ping: {
      '@keyframes ping': {
        '0%': {
          transform: 'scale(1)',
          opacity: 1,
        },
        '75%, 100%': {
          transform: 'scale(2)',
          opacity: 0,
        },
      },
    },
    pulse: {
      '@keyframes pulse': {
        '0%, 100%': {
          opacity: 1,
        },
        '50%': {
          opacity: 0.5,
        },
      },
    },
    bounce: {
      '@keyframes bounce': {
        '0%, 100%': {
          transform: 'translateY(-25%)',
          animationTimingFunction: 'cubic-bezier(0.8,0,1,1)',
        },
        '50%': {
          transform: 'translateY(0)',
          animationTimingFunction: 'cubic-bezier(0,0,0.2,1)',
        },
      },
    },
  }

  const keyframe = keyframes[classValue] || {}

  return {
    animation: `${animationConfig}${important}`,
    ...keyframe,
  }
}
