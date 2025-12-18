/**
 * Create GitHub Release and upload assets
 * This script bypasses release-it's buggy GitHub plugin
 */

const fs = require('fs')
const path = require('path')
const { Octokit } = require('@octokit/rest')

const REPO_OWNER = 's0985514623'
const REPO_NAME = 'bcst-xyflow'
const ASSET_NAME = 'r2-bcst-xyflow.zip'

async function createRelease() {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    console.error('❌ GITHUB_TOKEN is not set')
    process.exit(1)
  }

  // Read version from package.json
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))
  const version = packageJson.version
  const tagName = `v${version}`

  console.log(`📦 Creating GitHub Release ${tagName}...`)

  const octokit = new Octokit({ auth: token })

  try {
    // Create release
    const { data: release } = await octokit.repos.createRelease({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      tag_name: tagName,
      name: tagName,
      body: `Release ${tagName}`,
      draft: false,
      prerelease: false,
    })

    console.log(`✅ Release created: ${release.html_url}`)

    // Upload asset
    const assetPath = path.join(__dirname, ASSET_NAME)
    if (fs.existsSync(assetPath)) {
      console.log(`📤 Uploading ${ASSET_NAME}...`)

      const assetData = fs.readFileSync(assetPath)

      await octokit.repos.uploadReleaseAsset({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        release_id: release.id,
        name: ASSET_NAME,
        data: assetData,
        headers: {
          'content-type': 'application/zip',
          'content-length': assetData.length,
        },
      })

      console.log(`✅ Asset uploaded: ${ASSET_NAME}`)
    } else {
      console.warn(`⚠️ Asset not found: ${assetPath}`)
    }

    console.log(`🎉 GitHub Release created successfully!`)
    console.log(`🔗 ${release.html_url}`)

  } catch (error) {
    if (error.status === 422 && error.message.includes('already_exists')) {
      console.log(`⚠️ Release ${tagName} already exists, skipping...`)
    } else {
      console.error('❌ Failed to create release:', error.message)
      process.exit(1)
    }
  }
}

createRelease()
