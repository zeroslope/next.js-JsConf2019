/* eslint-disable react/jsx-fragments */
import React, { Component } from 'react'
import { withRouter } from 'next/router'
import fetch from 'isomorphic-fetch'
import filesize from 'filesize'

import '../../assets/repo.less'
import { Tree, Icon } from 'antd'

// mock
// import repoInfoFile from '../../data/repoinfo.json'
// import contentsFile from '../../data/contents.json'
const { TreeNode, DirectoryTree } = Tree

class TreeNodeTitle extends Component {
  render () {
    const { name, type, size } = this.props
    return (
      <React.Fragment>
        <span className='title-name'>{name}</span>
        {
          type !== 'dir' && <span className='title-size'>{filesize(size)}</span>
        }
      </React.Fragment>
    )
  }
}

class Index extends Component {
  static async getInitialProps ({ query }) {
    const { username, repo } = query
    const rawRepoInfo = await fetch(`https://api.github.com/repos/${username}/${repo}`)
    const repoInfo = await rawRepoInfo.json()
    const rawRepoContents = await fetch(`https://api.github.com/repos/${username}/${repo}/contents`)
    const repoContents = await rawRepoContents.json()
    return {
      repoInfo,
      repoContents
    }
  }

  state = {
    contents: []
  }

  componentDidMount () {
    this.setState({
      contents: this.props.repoContents.sort(this.fileCmpFn)
    })
  }

  fileCmpFn (fa, fb) {
    if (fa.type === fb.type) {
      console.log()
      if (fa.name === fb.name) return 0
      else return fa.name < fb.name ? -1 : 1
    } else {
      const faNum = fa.type === 'dir' ? 0 : 1
      const fbNum = fb.type === 'dir' ? 0 : 1
      return faNum - fbNum
    }
  }

  async getDirFiles (url) {
    const rawRepoContents = await fetch(`${url}`)
    const repoContents = await rawRepoContents.json()
    return repoContents.sort(this.fileCmpFn)
  }

  renderTreeNodes = data => {
    return data.map(item => {
      if (item.children) {
        return (
          <TreeNode key={item.path} title={item.name} dataRef={item}>
            {this.renderTreeNodes(item.children)}
          </TreeNode>
        )
      }
      return <TreeNode key={item.path} title={<TreeNodeTitle {...item} />} dataRef={item} isLeaf={item.type !== 'dir'} />
    })
  }

  onLoadData = async treeNode => {
    console.log(treeNode)
    if (treeNode.props.children || treeNode.props.dataRef.type !== 'dir') {
    } else {
      treeNode.props.dataRef.children = await this.getDirFiles(treeNode.props.dataRef.url)
      this.setState({
        contents: [...this.state.contents]
      })
    }
  }

  render () {
    const { router: { query: { username = 'zeit', repo = 'next.js' } }, repoInfo } = this.props
    const { contents } = this.state
    return (

      <div className='main'>
        <div className='repohead'>
          <h1>
            <a href={repoInfo.owner.html_url}>{username}</a>
            <span className='path-divider'>/</span>
            <strong><a href={repoInfo.html_url}>{repo}</a></strong>
          </h1>
          <h1 style={{
            color: '#24292e',
            fontSize: '16px'
          }}
          >{repoInfo.stargazers_count}✨
          </h1>
        </div>
        <div className='commit-tease' />
        <div className='tree-container'>
          <DirectoryTree
            showLine
            loadData={this.onLoadData}
            className='hide-file-icon'
            switcherIcon={<Icon type='down' />}
          >
            {this.renderTreeNodes(contents)}
          </DirectoryTree>
        </div>
      </div>
    )
  }
}

export default withRouter(Index)
