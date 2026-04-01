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

// ---- QR Section ----
const QRSection = ({ qr, status, state }: {
    qr: string; status: string; state: string
}) => (
    <div style={{
        display: "Flex", flexDirection: "Column", alignItems: "Center",
        marginTop: 6, marginBottom: 6,
    }}>
        {qr ? (
            <img
                src={"data:image/png;base64," + qr}
                style={{
                    width: 140, height: 140, borderRadius: 8,
                    marginBottom: 8, backgroundColor: "#fff",
                }}
            />
        ) : (
            <div style={{
                width: 140, height: 140, borderRadius: 8,
                marginBottom: 8, backgroundColor: "rgba(255,255,255,0.04)",
                display: "Flex", justifyContent: "Center", alignItems: "Center",
                fontSize: 12, color: DIM,
            }}>
                等待二维码...
            </div>
        )}
        {status ? (
            <div style={{ fontSize: 11, color: DIM, unityTextAlign: "MiddleCenter" }}>
                {status}
            </div>
        ) : null}
    </div>
)

// ---- Action Buttons ----
const ActionButtons = ({ state }: { state: string }) => {
    const api = getApi()
    if (!api) return null

    const isLoggingIn = state === "logging_in"

    switch (state) {
        case "logged_in":
            return (
                <div style={{ display: "Flex", flexDirection: "Row", justifyContent: "SpaceBetween" }}>
                    <ActionButton text="刷新登录态" onClick={() => api.refreshLogin()} />
                    <ActionButton text="登出" onClick={() => api.logout()} />
                </div>
            )
        case "logged_out":
            return (
                <div style={{ display: "Flex", flexDirection: "Row", justifyContent: "Center" }}>
                    <ActionButton text="登录" onClick={() => api.login()} primary />
                </div>
            )
        case "expired":
            return (
                <div style={{ display: "Flex", flexDirection: "Row", justifyContent: "SpaceBetween" }}>
                    <ActionButton text="重新登录" onClick={() => api.login()} primary />
                    <ActionButton text="登出" onClick={() => api.logout()} />
                </div>
            )
        case "logging_in":
            return (
                <div style={{ display: "Flex", flexDirection: "Row", justifyContent: "Center" }}>
                    <ActionButton text="扫码中..." onClick={() => {}} disabled />
                </div>
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
    const [qr, setQr] = useState("")

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
            setQr(api.qrCodeBase64 || "")
        }
        const timer = setInterval(poll, 500)
        poll()
        return () => clearInterval(timer)
    }, [])

    const api = getApi()
    const noApi = !api
    const showQR = state === "logged_out" || state === "expired" || state === "logging_in"

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

                    {showQR && (
                        <div>
                            <SectionTitle text="扫码登录" />
                            <QRSection qr={qr} status={status} state={state} />
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
    height: 360,
    initialX: 260,
    initialY: 140,
    launcher: {
        text: "󰎆",
        background: "#e7515a",
    },
    component: NeteaseMain,
})
