import { ClickAction } from "src/views/dashboard/edit-panel/components/ClickActionsEditor"
import { Panel, PanelEditorProps } from "types/dashboard"

export const PanelType = "datavTrace"

export interface TracePanel extends Panel {
    plugins: {
        [PanelType]: TraceSettings
    }
}

export interface TraceEditorProps extends PanelEditorProps {
    panel: TracePanel
}

export interface TraceSettings {
    defaultService: string
    enableEditService: boolean
    interaction: {
        enable: boolean
        actions: ClickAction[]
    }
}
