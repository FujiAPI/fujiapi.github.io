let ReleasePlatformNameMatches = {
    "linux-arm64": "Linux ARM64",
    "linux-arm": "Linux ARM",
    "linux-x64": "Linux x64",
    "macos-arm64": "MacOS ARM64",
    "macos-x64": "MacOS x64",
    "osx-x64": "MacOS x64",
    "windows-x64": "Windows x64",
    "win-x64": "Windows x64",
}

let MarkdownTransformers = [
    (input) => { return input.replace(/^#+ (.+)$/mg, "<h2>$1</h2>") }, // Headers
    (input) => { return input.replace(/`([^`]*)`/mg, "<code>$1</code>") }, // Code blocks
    (input) => { return input.replace(/\*\*([^\*]*)\*\*/mg, "<b>$1</b>") }, // Bold text
    (input) => { return input.replace(/\[([^\]]+)\]\(([^\)]+)\)/mg, `<a href="$2" target="_blank">$1</a>`) }, // Fancy links
    (input) => { return input.replace(/(?<!href=.+)(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+~#?&//=]*))/gi, `<a href="$1" target="_blank">$1</a>`) }, // Basic links
    (input) => { return input.split("\r\n").map((it) => `<p>${it}</p>`).join("") }, // Handle linebreaks
] // The best markdown parser of all time.

let releases;
let showOnlyStable = true;

function onReleasesRequestFinished() {
    document.getElementById("loading-message").remove()

    let resBody = JSON.parse(this.response)
    console.log(resBody)

    resBody = resBody.sort((a, b) => new Date(a.published_at) - new Date(b.published_at))
    resBody = resBody.reverse()

    releases = resBody

    regenReleasesList()
}

function regenReleasesList() {
    while (listingEl.firstChild) {
        listingEl.removeChild(listingEl.firstChild)
    }

    for (item of releases) {
        if (showOnlyStable && (item.tag_name.includes("beta") || item.name.toLowerCase().includes("beta"))) continue;

        let clon = listingTempl.cloneNode(true)

        clon.querySelector("#ReleaseName").innerText = item.name

        let bodyMd = `${item.body}`
        for (fn of MarkdownTransformers) {
            bodyMd = fn(bodyMd)
        } // Apply markdown
        clon.querySelector("#ReleaseDesc").innerHTML = `${bodyMd}`
        clon.querySelector("#ViewInfoButton").setAttribute("href", item.html_url)

        let assetLinkContainer = clon.querySelector("#AssetLinkContainer")

        for (asset of item.assets) {
            let newLinkWrap = document.createElement("p")
            let newLink = document.createElement("a")
            newLinkWrap.appendChild(newLink)

            for (matcher of Object.keys(ReleasePlatformNameMatches)) {
                if (asset.name.toLowerCase().includes(matcher)) { newLink.innerText = `Download for ${ReleasePlatformNameMatches[matcher]}`; break; }
            }

            if (!newLink.innerText) newLink.innerText = `Download ${asset.name}`

            newLink.setAttribute("href", asset.browser_download_url)

            assetLinkContainer.appendChild(newLinkWrap)
        }

        listingEl.appendChild(clon)
    }
}

let showBetaEl = document.getElementById("show-beta-button")
let listingEl = document.getElementById("release-listing")
let listingTempl = document.getElementById("release-listing-templ").content

showBetaEl.addEventListener("click", () => {
    showOnlyStable = false
    regenReleasesList()
})

let ghReleasesWebRequest = new XMLHttpRequest()
ghReleasesWebRequest.open("GET", `https://api.github.com/repos/FujiAPI/Fuji/releases`, true)

ghReleasesWebRequest.onload = onReleasesRequestFinished;

ghReleasesWebRequest.send();