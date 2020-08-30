/* eslint-disable complexity */
import { createMacro } from 'babel-plugin-macros'
import { findIdentifier, validateImports } from './macroHelpers'
import { isEmpty } from './utils'
import { getConfigProperties } from './configHelpers'
import {
  getCssConfig,
  updateCssReferences,
  addCssImport,
  maybeAddCssProperty,
} from './macro/css'
import {
  getStyledConfig,
  updateStyledReferences,
  addStyledImport,
} from './macro/styled'
import { handleThemeFunction } from './macro/theme'
import { handleTwProperty, handleTwFunction } from './macro/tw'
import getUserPluginData from './utils/getUserPluginData'
import { debugPlugins } from './logging'

const twinMacro = ({ babel: { types: t }, references, state, config }) => {
  validateImports(references)

  const program = state.file.path
  const { configExists, tailwindConfig } = getConfigProperties(state, config)

  state.configExists = configExists
  state.config = tailwindConfig
  state.hasSuggestions =
    typeof config.hasSuggestions === 'undefined'
      ? true
      : Boolean(config.hasSuggestions)
  state.disableStyleWarning =
    typeof config.disableStyleWarning === 'undefined'
      ? false
      : Boolean(config.disableStyleWarning)

  state.tailwindConfigIdentifier = program.scope.generateUidIdentifier(
    'tailwindConfig'
  )
  state.tailwindUtilsIdentifier = program.scope.generateUidIdentifier(
    'tailwindUtils'
  )

  /* eslint-disable-next-line unicorn/prevent-abbreviations */
  const isDev =
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'dev' ||
    false
  state.isDev = isDev
  state.isProd = !isDev

  state.debugProp = isDev ? Boolean(config.debugProp) : false
  state.debug = isDev ? Boolean(config.debug) : false

  state.userPluginData = getUserPluginData({ config: state.config })
  isDev &&
    Boolean(config.debugPlugins) &&
    state.userPluginData &&
    debugPlugins(state.userPluginData)

  // Styled import
  const styledImport = getStyledConfig(config)
  state.styledImport = styledImport
  state.styledIdentifier = findIdentifier({
    program,
    mod: styledImport.from,
    name: styledImport.import,
  })
  if (state.styledIdentifier === null) {
    state.styledIdentifier = program.scope.generateUidIdentifier('styled')
  } else {
    state.existingStyledIdentifier = true
  }

  // Css import
  const cssImport = getCssConfig(config)
  state.cssImport = cssImport
  state.cssIdentifier = findIdentifier({
    program,
    name: cssImport.import,
    mod: cssImport.from,
  })
  if (state.cssIdentifier === null) {
    state.cssIdentifier = program.scope.generateUidIdentifier('css')
  } else {
    state.existingCssIdentifier = true
  }

  state.sassyPseudo =
    config.sassyPseudo !== undefined
      ? config.sassyPseudo === true
      : state.styledImport.from.includes('goober') ||
        state.cssImport.from.includes('goober')

  // Tw prop/function
  handleTwProperty({ program, t, state })
  handleTwFunction({ references, t, state })

  // Css import
  updateCssReferences(references.css, state)
  const isImportingCss =
    !isEmpty(references.css) && !state.existingCssIdentifier
  if (isImportingCss) {
    addCssImport({ program, t, cssImport, state })
  }

  // Styled import
  updateStyledReferences(references.styled, state)
  if (!isEmpty(references.styled)) state.shouldImportStyled = true
  if (state.shouldImportStyled && !state.existingStyledIdentifier) {
    addStyledImport({ program, t, styledImport, state })
  }

  // Theme import
  handleThemeFunction({ references, t, state })

  // Auto add css prop for styled components
  if (
    (state.hasTwProp || state.hasCssProp) &&
    config.autoCssProp === true &&
    cssImport.from.includes('styled-components')
  ) {
    maybeAddCssProperty({ program, t })
  }

  program.scope.crawl()
}

export default createMacro(twinMacro, { configName: 'twin' })
