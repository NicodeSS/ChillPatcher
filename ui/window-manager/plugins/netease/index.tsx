import { h } from "preact"
import { useState, useEffect } from "preact/hooks"

declare const chill: any
declare const __registerPlugin: any

// ---- Constants ----
const NETEASE_RED = "#e7515a"
const BG = "#0b1020"
const CARD = "#111827"
const TEXT = "#e5e7eb"
const DIM = "#94a3b8"
const BORDER = "rgba(255,255,255,0.08)"
const SUCCESS = "#66BB6A"
const WARNING = "#FFA726"
const ACCENT = "#4FC3F7"

// ---- Helper: get NetEase JSApi ----
function getApi(): any {
    return chill.custom?.get("netease_account") ?? null
}

// ---- VIP helpers ----
function vipLabel(vipType: number): string {
    return vipType > 0 ? "VIP" : "免费用户"
}

function vipColor(vipType: number): string {
    return vipType > 0 ? NETEASE_RED : DIM
}

// ---- Session state helpers ----
function statusDotColor(state: string): string {
    switch (state) {
        case "logged_in": return SUCCESS
        case "expired": return WARNING
        default: return DIM
    }
}

function statusLabel(state: string): string {
    switch (state) {
        case "logged_in": return "已登录"
        case "logged_out": return "未登录"
        case "expired": return "登录已过期"
        case "logging_in": return "扫码中..."
        default: return "未知"
    }
}

// ---- Sub-components ----

const SectionTitle = ({ text }: { text: string }) => (
    <div style={{
        fontSize: 11, color: DIM, marginBottom: 6,
        paddingLeft: 2, letterSpacing: 0.5,
    }}>
        {text.toUpperCase()}
    </div>
)

const Separator = () => (
    <div style={{ height: 1, backgroundColor: BORDER, marginTop: 10, marginBottom: 10 }} />
)

const ActionButton = ({ text, onClick, primary = false, disabled = false }: {
    text: string; onClick: () => void; primary?: boolean; disabled?: boolean
}) => (
    <div
        onClick={disabled ? undefined : onClick}
        style={{
            fontSize: 12,
            color: disabled ? "rgba(255,255,255,0.3)" : (primary ? "#fff" : NETEASE_RED),
            backgroundColor: disabled ? "rgba(255,255,255,0.04)" : (primary ? NETEASE_RED : "rgba(255,255,255,0.06)"),
            paddingTop: 7, paddingBottom: 7,
            paddingLeft: 16, paddingRight: 16,
            borderRadius: 6, flexGrow: 1, marginLeft: 4, marginRight: 4,
            unityTextAlign: "MiddleCenter",
        }}
    >
        {text}
    </div>
)

// ---- Account Info ----
const AccountInfo = ({ state, nickname, avatar, vip }: {
    state: string; nickname: string; avatar: string; vip: number
}) => (
    <div style={{
        backgroundColor: CARD, borderRadius: 8, padding: 12, marginBottom: 10,
        display: "Flex", flexDirection: "Column", alignItems: "Center",
    }}>
        {state === "logged_in" && avatar ? (
            <img
                src={avatar}
                style={{
                    width: 48, height: 48, borderRadius: 24,
                    marginBottom: 8,
                }}
            />
        ) : null}
        <div style={{ fontSize: 13, color: TEXT, marginBottom: 2, unityTextAlign: "MiddleCenter" }}>
            {state === "logged_in" ? (nickname || "网易云用户") : statusLabel(state)}
        </div>
        <div style={{
            fontSize: 10,
            color: state === "logged_in" ? vipColor(vip) : DIM,
            unityTextAlign: "MiddleCenter",
        }}>
            {state === "logged_in" ? vipLabel(vip) : statusLabel(state)}
        </div>
    </div>
)

// ---- Login Guide Section ----
const LoginGuide = ({ state, status, qrCodeTexture }: {
    state: string; status: string; qrCodeTexture: any
}) => (
    <div style={{
        display: "Flex", flexDirection: "Column", alignItems: "Center",
        marginTop: 6, marginBottom: 6,
    }}>
        <div style={{
            backgroundColor: CARD, borderRadius: 8,
            padding: 16, marginBottom: 8,
        }}>
            {state === "logging_in" && qrCodeTexture ? (
                <div style={{
                    width: 160, height: 160,
                    backgroundImage: qrCodeTexture,
                    marginBottom: 10,
                }} />
            ) : null}
            <div style={{ fontSize: 12, color: TEXT, unityTextAlign: "MiddleCenter", marginBottom: 6 }}>
                {state === "logging_in"
                    ? "请用网易云 APP 扫描二维码"
                    : "点击下方「扫码登录」生成二维码"}
            </div>
            <div style={{ fontSize: 10, color: DIM, unityTextAlign: "MiddleCenter" }}>
                {state === "logging_in"
                    ? (status || "扫码后在手机上确认登录")
                    : "也可以播放列表中的「网易云扫码登录」"}
            </div>
        </div>
    </div>
)

// ---- Action Buttons ----
const ActionButtons = ({ state }: { state: string }) => {
    const api = getApi()
    if (!api) return null

    switch (state) {
        case "logged_in":
            return (
                <div>
                    <div style={{ display: "Flex", flexDirection: "Row", justifyContent: "SpaceBetween" }}>
                        <ActionButton text="刷新登录态" onClick={() => api.refreshLogin()} />
                        <ActionButton text="登出" onClick={() => api.logout()} />
                    </div>
                </div>
            )
        case "logged_out":
        case "expired":
            return (
                <ActionButton text="扫码登录" primary onClick={() => api.login()} />
            )
        case "logging_in":
            return (
                <ActionButton text="等待扫码确认" onClick={() => {}} disabled />
            )
        default:
            return null
    }
}

// ---- Main Component ----
const NeteaseMain = () => {
    const [state, setState] = useState("logged_out")
    const [nickname, setNickname] = useState("")
    const [avatar, setAvatar] = useState("")
    const [vip, setVip] = useState(0)
    const [status, setStatus] = useState("")
    const [qrCodeTexture, setQrCodeTexture] = useState<any>(null)

    // Poll API every 500ms
    useEffect(() => {
        const poll = () => {
            const api = getApi()
            if (!api) return
            setState(api.sessionState || "logged_out")
            setNickname(api.nickname || "")
            setAvatar(api.avatarUrl || "")
            setVip(api.vipType || 0)
            setStatus(api.statusMessage || "")
            setQrCodeTexture(api.qrCodeTexture || null)
        }
        const timer = setInterval(poll, 500)
        poll()
        return () => clearInterval(timer)
    }, [])

    const api = getApi()
    const noApi = !api
    const showLogin = state === "logged_out" || state === "expired" || state === "logging_in"

    return (
        <div style={{ flexGrow: 1, display: "Flex", flexDirection: "Column", backgroundColor: BG, padding: 16 }}>
            {/* Header */}
            <div style={{ display: "Flex", flexDirection: "Row", alignItems: "Center", marginBottom: 12 }}>
                <div style={{ fontSize: 22, color: NETEASE_RED, marginRight: 8 }}>󰎆</div>
                <div style={{ fontSize: 15, color: TEXT, unityFontStyleAndWeight: "Bold" }}>网易云音乐</div>
            </div>

            <Separator />

            {noApi ? (
                <div style={{ flexGrow: 1, display: "Flex", justifyContent: "Center", alignItems: "Center" }}>
                    <div style={{ fontSize: 12, color: DIM }}>等待网易云模块加载...</div>
                </div>
            ) : (
                <div style={{ flexGrow: 1 }}>
                    <SectionTitle text="账号" />
                    <AccountInfo state={state} nickname={nickname} avatar={avatar} vip={vip} />

                    {showLogin && (
                        <div>
                            <SectionTitle text="登录" />
                            <LoginGuide state={state} status={status} qrCodeTexture={qrCodeTexture} />
                        </div>
                    )}

                    {state === "logged_in" && status ? (
                        <div style={{ fontSize: 11, color: DIM, marginTop: 4 }}>{status}</div>
                    ) : null}

                    <div style={{ flexGrow: 1 }} />
                    <Separator />
                    <ActionButtons state={state} />
                </div>
            )}
        </div>
    )
}

// ---- Register ----
__registerPlugin({
    id: "netease",
    title: "网易云音乐",
    width: 280,
    height: 480,
    initialX: 260,
    initialY: 140,
    launcher: {
        text: "󰎆",
        background: "#e7515a",
    },
    component: NeteaseMain,
})
