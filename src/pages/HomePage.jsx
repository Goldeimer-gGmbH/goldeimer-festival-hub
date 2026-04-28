import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import { cacheGet, cacheSet } from '../lib/cache'
import { fetchWithTimeout } from '../lib/fetchWithTimeout'

const ROLLE_LABEL = {
  lead: 'Lead', operator: 'Operator',
  supporti_plus: 'Supporti+', supporti: 'Supporti', catering: 'Catering'
}

function IconZollstock() {
  return (
    <svg role="presentation" focusable="false" width="26" height="26" viewBox="0 0 28 28" style={{ display: 'block' }}>
      <path fill="currentColor" d="M22.78,21.63v-.06l-.12-1.57c0-.11-.04-.22-.1-.31-.1-1.04-.18-2.18-.15-2.74.19-1.28-.81-11.24-1.02-13.22-.04-.4-.39-.71-.8-.67l-5.74.44c-.42.04-.72.4-.69.81l.67,8.71-6.8-5.82c-.15-.13-.34-.19-.55-.18-.19.02-.38.11-.51.26l-3.74,4.38c-.26.3-.24.75.05,1.03.12.11,2.98,2.85,4.52,3.86,1.44.94,3.62,2.84,4.13,3.52.54.71,2.84,2.53,3.69,3.19l.08,1c.03.4.36.69.75.69h.06l1.22-.09h.1s2.29-.18,2.29-.18c.02,0,.03,0,.05-.01l2.08-.16c.42-.03.72-.39.69-.81l-.16-2.07ZM19.69,23.2l-1.67.13-.88.07-.07-.88-.41-5.35.66-.05.57-.05-.07-.89-1.23.09-.13-1.65.23-.02,1.68-.13-.07-.9-1.91.15-.13-1.66,1.23-.1-.07-.9-1.23.1-.13-1.67,1.91-.15-.07-.89-1.91.15-.12-1.56,1.23-.09-.07-.9-1.23.1-.09-1.21,4.27-.33c.45,4.55,1.07,11.32.94,12.18-.02.37-.01.89.02,1.45.05.71.12,1.49.18,2.13.05.43.09.79.12,1.03.02.17.04.27.04.29l.11,1.38-1.7.13ZM13.13,19.16c-.66-.87-3.02-2.9-4.51-3.87-1.06-.69-2.89-2.36-3.79-3.2l2.79-3.26.98.84-.79.93.68.59.8-.93,1.14.97-1.24,1.45.68.59,1.24-1.45,1.26,1.07-.8.94.69.58.8-.93,1.26,1.07-1.25,1.46.69.58,1.24-1.45.47,6.09c-1.04-.83-2.09-1.73-2.34-2.07Z"/>
      <path fill="currentColor" d="M20.32,20.57c-.1-.3-.3-.55-.56-.7-.04-.03-.07-.05-.11-.07-.33-.16-.69-.18-1.03-.07-.34.12-.61.36-.77.68-.09.19-.14.39-.14.59,0,.5.28.97.75,1.21.19.09.39.13.59.13.5,0,.98-.27,1.21-.75.15-.31.18-.65.07-.98,0-.01-.01-.03-.01-.04ZM19.45,21.2c-.08.16-.23.25-.39.25-.07,0-.14-.02-.2-.05-.22-.11-.31-.37-.2-.59.05-.11.14-.19.25-.23.05-.01.1-.02.14-.02.07,0,.14.02.2.05.11.05.18.14.22.25s.03.23-.02.34Z"/>
    </svg>
  )
}

function IconTransport() {
  return (
    <svg role="presentation" focusable="false" width="26" height="26" viewBox="0 0 28 28" style={{ display: 'block' }}>
      <path fill="currentColor" d="M24.36,14.57c-.45-.58-1.56-1-2.16-1.19l-1.03-1.55c.24-.03.45-.18.55-.4.13-.25.1-.56-.08-.79l-2.11-2.69c-.14-.18-.36-.29-.59-.29h-2.13c0-.2-.01-.35-.01-.42-.01-.82-.65-1.49-1.49-1.49h-.01s-1.82.14-2.9.01c-.63-.08-1.75-.05-2.94-.01-.99.02-2.01.05-2.52.01-1.22-.12-2.56-.01-2.56-.01-.79,0-1.44.68-1.44,1.47-.01.18-.23,4.35.01,5.8.18,1.07.05,4.3-.01,5.5,0,.84.65,1.52,1.44,1.52h.99c.02.46.19.97.83,1.5.59.49,1.56.76,2.41.76.59,0,1.13-.13,1.44-.41.45-.4.78-1.13.89-1.86,1.71-.09,3.66-.14,4.11-.06.16.08.33.12.49.12.18,0,.36-.04.52-.13.15-.09.28-.21.38-.35h1.41c-.05.57,0,1.23.83,1.93.59.49,1.56.76,2.41.76.59,0,1.12-.13,1.43-.41.54-.47.9-1.42.93-2.28h.04c.19,0,.37-.07.51-.2.06-.06.62-.58.89-.98.66-.98-.03-3.22-.53-3.86ZM9.1,20.73c-.26.14-1.42.08-1.94-.35-.17-.14-.25-.22-.29-.34-.03-.11-.01-.25.02-.5.02-.15.04-.3.05-.47.02-.2.2-.47.29-.5l.08-.02h.04c.27-.08.65-.18.92-.18.09,0,.16.01.21.03.13.05.24.09.34.15.36.17.55.36.63.6.08.23.04.58-.04.89-.08.31-.2.58-.31.69ZM15.31,11.85c-.18,1.06-.02,3.97-.01,4.26v2.39c-.52-.08-1.68-.13-4.49.03-.34-.89-1.18-1.3-1.8-1.53-.68-.26-1.47-.06-2.03.09l-.12.02c-.67.18-1.16.82-1.33,1.45h-1.09c.01-.18.23-4.34-.01-5.79-.18-1.07-.05-4.31.02-5.52,0,0,.57-.05,1.26-.05.35,0,.73.02,1.09.05.6.06,1.62.03,2.71,0,1.03-.03,2.19-.07,2.71,0,.42.05.92.07,1.4.07.74,0,1.42-.04,1.68-.06v.04c.07,1.45.13,3.86.01,4.55ZM17.23,9.16h1.34l.94,1.19h-2.28v-1.19ZM21.58,20.73c-.27.14-1.43.08-1.95-.35-.31-.27-.33-.32-.27-.77,0-.02.01-.05.01-.07.02-.15.04-.3.05-.47.01-.2.2-.47.29-.5l.12-.03c.27-.07.65-.17.92-.17.08,0,.15.01.21.03.59.22.87.44.97.75.04.13.05.29.03.46-.03.45-.21.97-.38,1.12ZM23.65,17.59c-.1.14-.29.35-.47.52h-.12c-.41-.61-1.06-.92-1.57-1.11-.69-.26-1.47-.06-2.04.09l-.11.02c-.52.14-.92.54-1.17,1h-1.37v-2.05c-.04-.84-.13-3.2-.01-3.97.01-.05.02-.1.02-.16l2.57-.06,1.72,2.57c.1.15.25.26.42.31.7.2,1.51.56,1.65.74.3.38.6,1.79.48,2.1Z"/>
    </svg>
  )
}

function IconStift() {
  return (
    <svg role="presentation" focusable="false" width="26" height="26" viewBox="0 0 28 28" style={{ display: 'block' }}>
      <path fill="currentColor" d="M24.28,10.32c-.15-1.21-.94-4.12-5.1-5.07-.79-.18-1.63.06-2.2.64L7.62,15.24c-.28.28-.49.63-.6,1l-1.25,4.25c-.08.27-.09.54-.08.81-.46.83-.94,2.04-.48,2.5.43.43,1.58.08,2.44-.3.12.02.25.04.38.04.19,0,.39-.02.58-.07l4.44-1.11c.42-.1.8-.32,1.1-.62l9.45-9.45c.52-.52.76-1.23.68-1.96ZM8.58,21.92c-.13-.26-.31-.53-.57-.79-.23-.23-.47-.39-.71-.52l1.09-3.69c.35.04,1.01.2,1.24.9l.12.35h.37s0,0,0,0c.11,0,.98.04,1.22,1.17l.08.36.37.03s.8.08.93,1.15c0,0-.01,0-.02,0l-4.12,1.02ZM13.58,20.19c-.27-.82-.86-1.22-1.34-1.38-.35-1.09-1.17-1.51-1.78-1.62-.33-.68-.93-1.03-1.47-1.19l6.92-6.92c.16-.03.32-.04.48,0,3.26.75,3.99,2.83,4.13,4,0,.06,0,.11,0,.17l-6.94,6.94ZM22.55,11.22l-1.14,1.14c-.33-1.43-1.39-3.39-4.58-4.2l1.21-1.21c.21-.21.52-.3.81-.24,2.96.68,3.78,2.43,3.94,3.79.03.27-.06.53-.25.72Z"/>
    </svg>
  )
}

function IconShare() {
  return (
    <svg role="presentation" focusable="false" width="26" height="26" viewBox="0 0 28 28" style={{ display: 'block' }}>
      <path fill="currentColor" d="M17.92,24.19c-.21,0-.42-.09-.56-.25-1.87-2.1-3.73-3.82-5.62-5.19-.3.45-.76.75-.98.9-.12.07-.22.14-.31.21-.52.36-1.06.74-2.08.4-.74-.25-1.35-.91-1.62-1.78-.16-.5-.04-1.13.16-2.03.05-.24.11-.49.13-.68-1.66-1.34-2.83-3.04-3.86-4.74-.38-.62-.25-1.07-.08-1.33.25-.39.67-.47.84-.51,6.57-1.3,13.37-2.64,20.24-2.07.32.03.58.25.66.55.38,1.42.21,3.09-.5,4.8-.46,1.1-1.07,2.11-1.66,3.09-.18.29-.35.58-.52.88-1.36,2.32-2.48,4.85-3.56,7.29-.1.23-.32.4-.57.44-.04,0-.08,0-.12,0ZM11.47,16.76c2.11,1.36,4.17,3.13,6.23,5.33.96-2.15,1.97-4.33,3.17-6.39.18-.3.36-.6.54-.89.59-.97,1.14-1.89,1.56-2.89.28-.67.55-1.55.58-2.49-4.2,2.4-8.67,4.35-13.28,5.81-.21.06-.4.12-.59.17-.14.04-.26.07-.37.1.05.03.09.05.14.08.06.03.11.06.17.09l.27.13c.52.25,1.14.55,1.58.95ZM8.39,16.73s0,.03,0,.05c-.08.37-.23,1.07-.19,1.27.12.39.37.7.65.79.3.1.31.1.75-.21.11-.07.22-.15.35-.24.39-.25.51-.4.55-.48-.51-.33-1.03-.63-1.55-.9-.02,0-.03-.02-.05-.02-.05-.03-.1-.05-.16-.08-.12-.06-.24-.12-.36-.18ZM4.68,10.59c.89,1.44,1.89,2.83,3.2,3.92.45-.31.95-.44,1.41-.56.17-.04.34-.09.53-.15,4.26-1.34,8.39-3.11,12.29-5.28-5.86-.18-11.72.95-17.42,2.07Z"/>
    </svg>
  )
}

function IconLupe() {
  return (
    <svg role="presentation" focusable="false" width="26" height="26" viewBox="0 0 28 28" style={{ display: 'block' }}>
      <path fill="currentColor" d="M21.12,6.54c-1.46-1.57-3.63-2.43-5.91-2.35-2.2.07-4.19,1.02-5.48,2.6-2.46,3.04-2.57,6.91-.34,10.08,0,0,0,0,0,0-.44.36-1.61,1.37-2.28,2.35-.44.65-1.96,1.91-2.8,2.56-.5.38-.6,1.09-.22,1.59.22.29.56.45.9.45.24,0,.48-.08.68-.23.25-.19,2.51-1.92,3.3-3.08.49-.72,1.55-1.64,1.95-1.97,1.17.91,2.62,1.41,4.22,1.46h.23c2.17,0,4.3-.88,5.72-2.38,3.02-3.18,3.02-7.84.01-11.08ZM11.09,16.62c-2.3-2.71-2.37-6.2-.19-8.89,1.01-1.24,2.6-1.99,4.36-2.04.08-.01.16-.01.23-.01,1.77,0,3.41.68,4.53,1.88,1.23,1.32,1.84,2.94,1.84,4.54s-.61,3.2-1.84,4.49c-1.18,1.25-2.96,1.96-4.81,1.91-1.67-.05-3.14-.72-4.12-1.88Z"/>
      <path fill="currentColor" d="M20.03,12.92c-.23,0-.42-.19-.42-.43,0-2.65-2.16-4.81-4.81-4.81-.23,0-.42-.19-.42-.43s.19-.43.42-.43c3.12,0,5.66,2.54,5.66,5.66,0,.23-.19.43-.42.43Z"/>
    </svg>
  )
}

function IconOrderbird() {
  return (
    <svg role="presentation" focusable="false" strokeWidth="2" width="26" height="26"
      viewBox="0 0 28 28" style={{ display: 'block' }}>
      <path fill="currentColor" d="M24.9,7.5c-.03-.74-.65-1.32-1.39-1.3l-19.54.68c-.74.03-1.32.65-1.3,1.39l.42,12.24c.02.73.62,1.3,1.35,1.3h.04l19.54-.68h0c.74-.03,1.32-.65,1.3-1.39l-.42-12.24ZM4.18,8.37l6.98-.24c.05.29.1.59.14.89.07.63.06,1.22-.02,1.66-.05.26-.12.48-.2.69-.11.33-.23.66-.27,1.12-.07.75.07,1.53.24,2.27.14.61.3,1.31.26,1.99-.02.41-.12.76-.21,1.09-.1.34-.21.77-.24,1.29,0,.07-.02.54.08.97l-6.34.22-.41-11.94ZM11.83,20.06l.03-.03c-.05-.08-.13-.44-.11-.86.02-.42.12-.78.21-1.09.1-.36.22-.77.24-1.28.05-.8-.13-1.6-.28-2.24-.15-.66-.28-1.36-.22-1.98.03-.36.13-.63.23-.92.09-.25.17-.51.23-.82.1-.52.11-1.2.03-1.92-.03-.28-.08-.56-.12-.82l11.35-.39.41,11.94-12,.41Z"/>
      <path fill="currentColor" d="M18.55,9.19c.04-.25-.13-.47-.38-.51-.25-.03-.48.13-.51.38-.14.91-.03,1.85.3,2.71.07.18.24.29.42.29.05,0,.11,0,.16-.03.23-.09.35-.35.26-.58-.27-.72-.36-1.49-.25-2.25Z"/>
      <path fill="currentColor" d="M20.77,12.01c.76-.13,1.2-.91,1.2-1.58,0-.99-.48-1.35-.77-1.47-.47-.21-1.06-.07-1.51.35-.5.46-.68,1.13-.47,1.75.2.58.76.98,1.34.98.07,0,.14,0,.21-.02ZM20.07,10.76c-.14-.41.14-.71.22-.79.14-.13.31-.2.44-.2.04,0,.08,0,.11.02.14.06.22.3.23.65,0,.29-.18.64-.45.69-.21.04-.46-.13-.54-.36Z"/>
      <path fill="currentColor" d="M7.14,16.68c.04-.25-.13-.47-.38-.51-.25-.03-.47.13-.51.38-.1.66-.02,1.35.22,1.97.07.18.24.29.42.29.05,0,.11,0,.16-.03.23-.09.35-.35.26-.58-.19-.48-.24-1.01-.17-1.52Z"/>
      <path fill="currentColor" d="M8.93,16.37c-.38-.16-.86-.06-1.21.27-.39.36-.53.89-.36,1.37.16.46.61.78,1.07.78.06,0,.11,0,.17-.01.55-.1.96-.63.96-1.24,0-.77-.39-1.06-.62-1.16ZM8.44,17.89c-.09,0-.2-.07-.23-.17h0c-.07-.21.06-.36.12-.42.09-.08.18-.11.22-.11,0,0,.02,0,.02,0,.01,0,.08.09.08.34,0,.16-.1.33-.21.35Z"/>
      <path fill="currentColor" d="M22.07,17.71l-1.45.05c-.25.01-.45.22-.44.46.01.25.21.44.45.44h.02l1.45-.05c.25-.01.44-.22.43-.47-.01-.24-.23-.44-.46-.43Z"/>
      <path fill="currentColor" d="M22.07,16.42l-1.45.05c-.25.01-.45.22-.44.46.01.25.21.44.45.44h.02l1.45-.05c.25-.01.44-.22.43-.47-.01-.24-.23-.44-.46-.43Z"/>
      <path fill="currentColor" d="M7.83,11.14c-.01-.24-.23-.44-.46-.43l-1.45.05c-.25.01-.45.22-.44.46.01.25.21.44.45.44h.02l1.45-.05c.25-.01.44-.22.43-.47Z"/>
      <path fill="currentColor" d="M5.93,10.37h.02l1.45-.05c.25-.01.44-.22.43-.47-.01-.24-.23-.44-.46-.43l-1.45.05c-.25.01-.45.22-.44.46.01.25.21.44.45.44Z"/>
    </svg>
  )
}

function IconKalender() {
  return (
    <svg role="presentation" focusable="false" width="26" height="26" viewBox="0 0 28 28" style={{ display: 'block' }}>
      <path fill="currentColor" d="M25.17,11.1c.01-.1.01-.19.01-.29l-.13-3.59c-.04-1.31-.94-2.34-2.05-2.34h-1.31v-.39c0-.27-.22-.5-.5-.5h-.66c-.28,0-.5.23-.5.5v.39h-1.74v-.39c0-.27-.22-.5-.5-.5h-.66c-.27,0-.5.23-.5.5v.44l-1.85.07v-.51c0-.27-.22-.5-.5-.5h-.66c-.27,0-.5.23-.5.5v.58h-.35s-1.4-.05-1.4-.05v-.53c0-.27-.22-.5-.5-.5h-.66c-.27,0-.5.23-.5.5v.45l-1.46-.06h-.28v-.39c0-.27-.22-.5-.5-.5h-.66c-.28,0-.5.23-.5.5v.39h-1.38c-.5,0-.98.21-1.35.59-.45.46-.7,1.13-.7,1.83v.12l.15,4.41-.21,6.35v3.36c0,.74.27,1.43.74,1.89.38.37.87.56,1.35.55l6.22-.15,8.07.18h3.71c.49,0,.96-.21,1.33-.58.47-.49.73-1.19.71-1.93l-.12-5.04v-.12l.34-5.24ZM4.66,6.52c.06-.07.16-.14.27-.14h1.38v.38c0,.28.22.5.5.5h.66c.28,0,.5-.22.5-.5v-.38h.24l1.5.07v.32c0,.28.23.5.5.5h.66c.28,0,.5-.22.5-.5v-.24l1.34.06h.41s0,.18,0,.18c0,.28.23.5.5.5h.66c.28,0,.5-.22.5-.5v-.26l1.85-.07v.33c0,.28.23.5.5.5h.66c.28,0,.5-.22.5-.5v-.38h1.74v.38c0,.28.22.5.5.5h.66c.28,0,.5-.22.5-.5v-.38h1.31c.25,0,.54.38.55.89l.09,2.42H4.46l-.08-2.32c0-.34.09-.66.28-.85ZM10.14,22.35l-5.27.13c-.07,0-.17-.04-.26-.12-.18-.18-.29-.49-.29-.82v-3.33l.05-1.58c1.98-.16,3.98-.24,5.98-.26,0,2-.06,4.01-.21,5.99ZM10.5,11.69l-.03.19c-.15,1.14-.14,2.37-.13,3.56v.08c-1.98.02-3.97.1-5.95.26l.13-3.88v-.21l-.04-1.14h6.04c.03.1.05.28.04.52,0,.22-.04.42-.07.62ZM16.88,22.46l-5.74-.13h-.14c.14-1.97.21-3.97.21-5.97,1.62-.01,3.24,0,4.83.01h.77c0,.05,0,.1,0,.15l.03,1.33c.04,1.51.07,3.07.04,4.61ZM16.79,15.53h-.75c-1.59-.02-3.21-.03-4.83-.02v-.09c-.01-1.16-.03-2.36.12-3.44l.03-.18c.03-.23.07-.46.08-.71,0-.12,0-.33-.03-.56h5.56c-.16,1.64-.19,3.34-.16,4.99ZM23.17,22.38c-.06.06-.15.13-.26.13h-3.7l-1.49-.03c.04-1.55,0-3.12-.04-4.65l-.03-1.33s0-.08,0-.12l5.68.05v.06l.12,5.03c.01.34-.1.66-.28.85ZM23.67,11l-.3,4.59-5.74-.05c-.02-1.65,0-3.36.17-5h5.87v.31s.01.1,0,.15Z"/>
      <path fill="currentColor" d="M6.81,11.63l.02-.1c.04-.18-.05-.36-.21-.45-.14-.08-.32-.07-.45.02-.11-.12-.28-.17-.44-.12-.14.04-.24.15-.28.28,0,0-.02.01-.03.02-.14.1-.19.27-.17.42,0,0,0,0,0,0-.06.18-.04.37.06.51.08.13.21.21.38.23.05,0,.1,0,.16-.02,0,0,0,0,0,0,.06.17.22.28.4.28.01,0,.02,0,.04,0,.14-.01.25-.09.32-.2.1.02.21.01.3-.04.21-.11.28-.37.17-.58-.06-.11-.16-.2-.26-.26Z"/>
      <path fill="currentColor" d="M12.61,12.24c.16,0,.32-.06.45-.17.17-.16.18-.43.02-.6-.07-.07-.16-.12-.25-.13-.02-.09-.08-.17-.16-.23-.19-.14-.46-.1-.59.09-.2.27-.16.66.09.88.12.11.28.16.44.16Z"/>
      <path fill="currentColor" d="M19.46,11.53c.01-.09.01-.18,0-.27-.04-.23-.25-.36-.49-.33-.13.02-.24.11-.31.22h-.04c-.1.02-.25.05-.33.15-.08.1-.12.23-.09.36.05.26.22.48.46.6.12.06.25.09.37.09s.26-.03.38-.09c.21-.11.3-.36.19-.57-.03-.07-.08-.12-.14-.16Z"/>
      <path fill="currentColor" d="M5.24,18.27s.08.02.12.02c.19,0,.36-.12.41-.31.06-.22.03-.46-.08-.66-.12-.2-.38-.27-.58-.15-.2.12-.27.38-.16.58-.06.23.07.46.29.52Z"/>
      <path fill="currentColor" d="M12.5,17.03s-.02-.01-.04-.02c-.08-.05-.17-.06-.27-.07-.23.01-.42.24-.41.47-.15.17-.14.43.02.59.08.08.19.12.3.12s.21-.04.29-.11c.13-.12.23-.26.31-.42.1-.21.01-.47-.2-.57Z"/>
      <path fill="currentColor" d="M19.52,17.39c0-.08-.01-.16-.05-.23-.11-.21-.37-.29-.58-.17-.07.04-.18.09-.27.2-.15.16-.21.38-.15.58.07.25.31.43.58.43,0,0,.02,0,.03,0,.16,0,.29-.05.38-.09.22-.09.29-.33.2-.54-.03-.07-.08-.13-.14-.17Z"/>
    </svg>
  )
}

function IconSozial() {
  return (
    <svg role="presentation" focusable="false" strokeWidth="2" width="26" height="26"
      viewBox="0 0 28 28" style={{ display: 'block' }}>
      <path fill="currentColor" d="M9.28,22.85c-1.01-.23-1.39-.72-1.41-1.77-.36-.19-.73-.34-1.06-.57-.48-.33-.78-.79-.85-1.38-.02-.15-.08-.3-.16-.43-1-1.65-2.05-3.27-3.02-4.95-2.24-3.9-.04-8.69,4.37-9.56,2.58-.51,5.28.7,6.67,2.98.1.16.19.32.31.51.73-.68,1.46-1.32,2.14-2,.91-.91,1.99-1.39,3.27-1.36.83.01,1.66.05,2.48.16,1.02.14,1.8.73,2.36,1.57,1.16,1.72,1.69,3.66,1.71,5.72,0,.59-.31,1.21-.6,1.76-.82,1.59-2.1,2.81-3.44,3.97-.3.26-.62.51-.88.73.14.54.33,1.04.38,1.55.11,1.21-.5,1.73-1.65,1.59-.26.5-.49.98-.76,1.44-.22.37-.57.55-.99.6-.08.01-.2.06-.23.13-.43.81-1.15,1.03-1.99.98-.28-.02-.42.05-.57.3-.53.87-1.58,1.29-2.52,1.06-.47-.11-.84-.37-1.06-.8-.11-.21-.23-.31-.49-.3-1.15.02-1.94-.74-2.02-1.91ZM6.63,17.59c.53-.19.95-.38,1.39-.48,1.39-.34,2.16.16,2.47,1.56.02.11.1.23.18.31,1.47,1.29,2.95,2.57,4.43,3.86.21.19.43.46.67.49.26.03.56-.16.82-.29.02-.01-.07-.38-.19-.51-.42-.49-.86-.96-1.32-1.41-.87-.87-1.77-1.71-2.64-2.58-.32-.33-.29-.78.01-1.03.29-.24.68-.19.99.13.22.23.45.44.67.67,1.17,1.17,2.35,2.34,3.51,3.52.25.25.46.27.59-.04.09-.22.15-.56.05-.75-.2-.37-.47-.72-.79-1-1.01-.89-2.06-1.73-3.08-2.61-.34-.29-.33-.71-.06-.99.25-.26.65-.25.97.01,1.09.91,2.17,1.82,3.27,2.72.47.38.97.73,1.62.83.04-.65-.27-1.11-.67-1.47-.46-.42-1.01-.75-1.48-1.17-1.17-1.05-2.32-2.12-3.47-3.21-.25-.24-.42-.24-.68-.03-.57.45-1.17.87-1.76,1.31-.56.41-1.2.6-1.88.64-.95.05-1.52-.47-1.56-1.42-.03-.66.15-1.26.55-1.77.36-.46.76-.89,1.16-1.32.82-.88,1.65-1.74,2.46-2.63.1-.11.13-.38.07-.51-1.1-2.55-4.15-3.69-6.71-2.55-2.55,1.14-3.78,4.24-2.53,6.71.88,1.73,1.95,3.36,2.92,5.01ZM20.19,17.3c.65-.56,1.23-1.03,1.77-1.54.98-.91,1.89-1.88,2.48-3.1.17-.35.35-.76.34-1.13-.07-1.41-.43-2.76-1.06-4.04-.41-.82-1.05-1.36-1.88-1.65-.43-.15-.92-.17-1.39-.19-1.17-.06-2.28.04-3.18.95-1.06,1.07-2.18,2.07-3.24,3.13-1.01,1.01-1.98,2.06-2.96,3.1-.29.31-.57.65-.79,1.01-.14.23-.17.54-.27.86.67.06,1.14-.17,1.57-.49.68-.5,1.35-1.01,2.05-1.48.69-.46.88-.45,1.51.11.69.61,1.32,1.27,2.01,1.88,1,.87,2.02,1.72,3.05,2.59ZM12.35,22.72c0-.45-.4-.84-.86-.84-.45,0-.82.37-.83.82-.01.45.38.86.83.87.44,0,.86-.41.86-.85ZM10.72,20.93c0-.46-.37-.86-.82-.88-.44-.01-.86.37-.88.82-.02.45.41.89.87.88.42,0,.82-.41.83-.83ZM9.18,19.07c-.08-.24.04-.71-.43-.68-.42.03-.85.21-1.25.37-.24.1-.27.36-.05.52.27.2.57.36.88.48.43.17.84-.16.85-.68ZM14.01,24.13c0-.32-.25-.57-.57-.57-.33,0-.6.27-.58.61.02.32.27.55.6.54.33,0,.56-.25.56-.58Z"/>
    </svg>
  )
}

const ALL_TOPICS = [
  { icon: <IconZollstock />,  title: 'Auf- und Abbauanleitung Modul',      slug: 'abbau-modul',      iconRaw: true },
  { icon: <IconTransport />,  title: 'Auf- und Abbauanleitung Container',  slug: 'abbau-container',  iconRaw: true },
  { icon: <IconStift />,      title: 'Crew-Briefing',                      slug: 'crew-briefing',    iconRaw: true },
  { icon: <IconShare />,      title: 'Promo-Team-Briefing',                slug: 'promo-briefing',   iconRaw: true },
  { icon: <IconKalender />,   title: 'Welcome-Meeting-Briefing',           slug: 'welcome-briefing', iconRaw: true },
  { icon: <IconOrderbird />,  title: 'How to Orderbird',                   slug: 'orderbird',        leadOnly: true, iconRaw: true },
  { icon: <IconLupe />,       title: 'FAQ',                                slug: 'faq',              iconRaw: true },
  { icon: <IconSozial />,     title: 'Code of Conduct',                    slug: 'code-of-conduct',  iconRaw: true },
]

export default function HomePage() {
  const { profile } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => { loadAssignments() }, [])

  async function loadAssignments() {
    const cacheKey = `assignments_${profile.id}`
    setFetchError(false)

    const cached = cacheGet(cacheKey)
    if (cached) { setAssignments(cached); setLoading(false) }

    const { data, error } = await fetchWithTimeout(
      supabase.from('assignments')
        .select(`id, role, status, festival:festivals(id, name, details)`)
        .eq('profile_id', profile.id)
        .in('status', ['zugesagt', 'akkreditiert', 'teilgenommen'])
    )
    if (!error && data) {
      setAssignments(data)
      cacheSet(cacheKey, data, 30 * 60 * 1000)
    } else if (error && !cached) {
      setFetchError(true)
    }
    setLoading(false)
  }

  const vorname = profile?.full_name?.split(' ')[0] || 'Hey'
  const isLeadOrOp = profile?.role === 'lead' || profile?.role === 'operator'

  const topics = ALL_TOPICS.filter(t => !t.leadOnly || isLeadOrOp)

  // Festivals nach Startdatum sortieren, vergangene ans Ende
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sorted = [...assignments].sort((a, b) => {
    const aEnd = parseDeDate(getRoleEnd(a.role, a.festival?.details || {}))
    const bEnd = parseDeDate(getRoleEnd(b.role, b.festival?.details || {}))
    const aStart = parseDeDate(getRoleStart(a.role, a.festival?.details || {}))
    const bStart = parseDeDate(getRoleStart(b.role, b.festival?.details || {}))
    const aPast = aEnd ? aEnd < today : false
    const bPast = bEnd ? bEnd < today : false
    if (aPast !== bPast) return aPast ? 1 : -1
    return (aStart || 0) - (bStart || 0)
  })

  return (
    <div>
      <div className="header">
        <img src="/goldeimer-logo.png" alt="Goldeimer" style={{ height: 36 }} />
        <Link to="/profil" style={{ textDecoration: 'none', color: 'var(--schwarz)', display: 'flex', alignItems: 'center' }}>
          <img src="/icon-account.svg" alt="Profil" style={{ width: 26, height: 26 }} />
        </Link>
      </div>

      {/* Greeting Banner – Full-Bleed (breiter als der 480px-Body) */}
      <div style={{
        background: 'var(--schwarz)',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
      }}>
        {/* Innerer Content bleibt auf max 480px zentriert */}
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--sp-6) var(--sp-4) 0' }}>
          <div className="statement" style={{ fontSize: 'var(--text-h0)', color: 'var(--gelb)', lineHeight: 1 }}>
            Hey {vorname}!
          </div>
          <p style={{ color: 'var(--on-dark-sub)', marginTop: 6, marginBottom: 'var(--sp-6)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
            Deine Festivals 2026 mit Goldeimer
          </p>
        </div>

        {/* Welle: Schwarz → Papier */}
        <svg viewBox="0 0 480 64" preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: 56, marginBottom: -2 }}>
          <path d="M0,32 C80,64 160,8 260,36 C340,58 420,12 480,28 L480,64 L0,64 Z"
            fill="var(--papier)" />
        </svg>
      </div>

      <div className="page" style={{ paddingTop: 'var(--sp-5)' }}>

        {/* Skeleton */}
        {loading && [1, 2].map(i => (
          <div key={i} style={{
            background: 'var(--weiss)', borderRadius: 'var(--rounded)',
            padding: 'var(--sp-3) var(--sp-4)', marginBottom: 'var(--sp-2)',
            opacity: 0.5,
          }}>
            <div style={{ height: 16, width: '55%', background: 'var(--border)', borderRadius: 4, marginBottom: 8 }} />
            <div style={{ height: 12, width: '35%', background: 'var(--border)', borderRadius: 4 }} />
          </div>
        ))}

        {/* Fehler */}
        {!loading && fetchError && (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📡</div>
            <p className="card-sub" style={{ marginBottom: 16 }}>Verbindung unterbrochen.</p>
            <button className="button" onClick={loadAssignments}>Nochmal versuchen</button>
          </div>
        )}

        {/* Leer */}
        {!loading && !fetchError && assignments.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎪</div>
            <p className="card-sub">Noch keine Festivals zugewiesen. Melde dich bei Goldeimer.</p>
          </div>
        )}

        {/* Festival-Karten */}
        {sorted.map(a => {
          const details = a.festival?.details || {}
          const town    = details.festival_town || ''
          const start   = getRoleStart(a.role, details)
          const end     = getRoleEnd(a.role, details)
          const endDate = parseDeDate(end)
          const isPast  = endDate ? endDate < today : false

          return (
            <Link
              key={a.id}
              to={`/festival/${a.festival.id}`}
              className="festival-card"
              style={isPast ? { opacity: 0.45 } : {}}
            >
              <div className="festival-card-header">
                <div className="festival-card-name">{a.festival.name}</div>
                <span className="festival-card-role">{ROLLE_LABEL[a.role] || a.role}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'var(--sp-2)' }}>
                <div className="festival-card-meta">
                  {formatDateRange(start, end)}{town ? ` | ${town}` : ''}
                </div>
                <span style={{ fontSize: 16, opacity: 0.45 }}>→</span>
              </div>
            </Link>
          )
        })}

        {/* Infos & Anleitungen */}
        <div className="section-title" style={{ marginTop: 'var(--sp-8)' }}>
          {isLeadOrOp ? 'Infos für Leads & Operator' : 'Allgemeine Infos'}
        </div>

        {/* Topic-Liste */}
        <div style={{
          background: 'var(--weiss)',
          borderRadius: 'var(--rounded)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {topics.map((topic, i) => (
            <Link
              key={topic.slug}
              to={`/infos?section=${topic.slug}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-3)',
                padding: 'var(--sp-3) var(--sp-4)',
                borderBottom: i < topics.length - 1 ? '1px solid var(--border)' : 'none',
                textDecoration: 'none',
                color: 'var(--schwarz)',
              }}
            >
              {topic.iconRaw ? (
                <span style={{
                  width: 36, height: 36, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {topic.icon}
                </span>
              ) : (
                <span style={{
                  width: 36, height: 36,
                  background: 'var(--gelb)',
                  borderRadius: 'var(--rounded-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>
                  {topic.icon}
                </span>
              )}
              <span style={{ flex: 1, fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                {topic.title}
              </span>
              <span style={{ fontSize: 18, opacity: 0.4 }}>→</span>
            </Link>
          ))}
        </div>

        {/* Footer – Full-Bleed */}
        <div style={{
          marginTop: 'var(--sp-10)',
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
        }}>
          {/* Welle: Papier → Schwarz */}
          <svg viewBox="0 0 480 64" preserveAspectRatio="none"
            style={{ display: 'block', width: '100%', height: 56, marginBottom: -2 }}>
            <path d="M0,36 C80,8 180,56 280,24 C360,4 420,48 480,28 L480,64 L0,64 Z"
              fill="var(--schwarz)" />
          </svg>
          <div style={{
            background: 'var(--schwarz)',
            padding: 'var(--sp-5) var(--sp-4)',
            textAlign: 'center',
          }}>
            <p style={{ color: 'var(--on-dark-sub)', fontSize: 'var(--text-xs)' }}>
              © Goldeimer gGmbH · Kacke für den guten Zweck 💛
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

function getRoleStart(role, details) {
  if (role === 'supporti_plus') return details.start_setup
  if (role === 'supporti')      return details.start_supp
  if (role === 'lead' || role === 'operator') return details.start_leadop
  if (role === 'catering')      return details.start_kitchen
  return details.start_official || details.start_supp
}

function getRoleEnd(role, details) {
  if (role === 'supporti_plus') return details.end_takedown || details.end_official
  if (role === 'supporti')      return details.end_supp     || details.end_official
  if (role === 'lead' || role === 'operator') return details.end_leadop || details.end_official
  if (role === 'catering')      return details.end_kitchen  || details.end_official
  return details.end_official
}

function parseDeDate(str) {
  if (!str) return null
  const match = String(str).match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  if (!match) return null
  const [, day, month, year] = match
  return new Date(+year, +month - 1, +day)
}

function formatDateRange(startStr, endStr) {
  if (!startStr) return ''
  try {
    const s = parseDeDate(startStr)
    if (!s) return ''
    const startFmt = s.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
    if (!endStr) return startFmt + '.'
    const e = parseDeDate(endStr)
    if (!e) return startFmt + '.'
    const endFmt = e.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    return `${startFmt} – ${endFmt}`
  } catch { return '' }
}
