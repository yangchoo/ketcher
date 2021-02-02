/****************************************************************************
 * Copyright 2020 EPAM Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************/

import { xor } from 'lodash/fp'

import React, { Component } from 'react'
import { connect } from 'react-redux'

import element from '../../../../../chem/element'

import { Dialog } from '../../../components'
import Tabs from '../../../../component/view/Tabs'

import { fromElement, toElement } from '../../../../data/convert/structconv'
import { onAction } from '../../../../state'
import { addAtoms } from '../../../../state/toolbar'

import {
  ElementsTable,
  AtomInfo,
  TypeChoice,
  GenericGroups
} from './components'

import styles from './PeriodTable.module.less'

class Table extends Component {
  constructor(props) {
    super(props)
    const genType = !this.props.pseudo ? null : 'gen'
    this.state = {
      type: props.type || genType || 'atom',
      value: props.values || props.label || null,
      current: element[2],
      isInfo: false
    }
    this.firstType = true
  }

  changeType = type => {
    if (this.firstType) {
      this.firstType = false
      return
    }
    const pl = this.state.type === 'list' || this.state.type === 'not-list'
    const l = type === 'list' || type === 'not-list'
    if (l && pl) {
      this.setState({ type })
    } else {
      this.setState({
        type,
        value: type === 'atom' || type === 'gen' ? null : []
      })
    }
  }

  selected = label => {
    const { type, value } = this.state
    return type === 'atom' || type === 'gen'
      ? value === label
      : value.includes(label)
  }

  onSelect = label => {
    const { type, value } = this.state
    this.setState({
      value: type === 'atom' || type === 'gen' ? label : xor([label], value)
    })
  }

  result = () => {
    const { type, value } = this.state
    if (!value || !value.length) {
      return null
    }
    if (type === 'atom') {
      return { label: value, pseudo: null }
    } else if (type === 'gen') {
      return { type, label: value, pseudo: value }
    }
    return { type, values: value }
  }

  currentEvents = element => {
    return {
      onMouseEnter: () => this.setState({ current: element, isInfo: true }),
      onMouseLeave: () => this.setState({ isInfo: false })
    }
  }

  periodicTable = value => {
    const { type, current, isInfo } = this.state
    return (
      <div className={styles.period_table}>
        <AtomInfo el={current} isInfo={isInfo} />
        <ElementsTable
          value={value}
          currentEvents={this.currentEvents}
          selected={this.selected}
          onSelect={this.onSelect}
        />
        <TypeChoice value={type} onChange={event => this.changeType(event)} />
      </div>
    )
  }

  render() {
    const { type, value } = this.state
    const tabs = [
      {
        caption: 'Table',
        component: this.periodicTable,
        props: { value }
      },
      {
        caption: 'Extended',
        component: GenericGroups,
        props: {
          className: 'generic-groups',
          selected: this.selected,
          onSelect: this.onSelect
        }
      }
    ]

    return (
      <Dialog
        title="Periodic table"
        className={styles.elements_table}
        params={this.props}
        result={() => this.result()}>
        <Tabs
          className={styles.tabs}
          contentClassName={styles.tabs_content}
          captions={tabs}
          tabIndex={type !== 'gen' ? 0 : 1}
          changeTab={event => this.changeType(event === 0 ? 'atom' : 'gen')}
          tabs={tabs}
        />
      </Dialog>
    )
  }
}

function mapSelectionToProps(editor) {
  const selection = editor.selection()

  if (
    selection &&
    Object.keys(selection).length === 1 &&
    selection.atoms &&
    Object.keys(selection.atoms).length === 1
  ) {
    const struct = editor.struct()
    const atom = struct.atoms.get(selection.atoms[0])
    return { ...fromElement(atom) }
  }

  return {}
}

const PeriodTable = connect(
  (store, props) => {
    if (props.values || props.label) return {}
    return mapSelectionToProps(store.editor)
  },
  (dispatch, props) => ({
    onOk: res => {
      if (!res.type || res.type === 'atom') dispatch(addAtoms(res.label))
      dispatch(onAction({ tool: 'atom', opts: toElement(res) }))
      props.onOk(res)
    }
  })
)(Table)

export default PeriodTable
