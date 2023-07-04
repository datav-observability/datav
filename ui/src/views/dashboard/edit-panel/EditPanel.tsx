import { Box, Button, Center, Flex, HStack, Image, Input, Modal, ModalBody, ModalContent, ModalHeader, ModalOverlay, SimpleGrid, Switch, Tab, TabIndicator, TabList, TabPanel, TabPanels, Tabs, Text, Textarea, useDisclosure } from "@chakra-ui/react"
import { ColorModeSwitcher } from "components/ColorModeSwitcher"
import { useEffect, useState } from "react"
import { Dashboard, Panel, PanelType } from "types/dashboard"
import EditPanelQuery from "./Query"
import { useImmer } from "use-immer";
import { removeParamFromUrl } from "utils/url";
import { useSearchParam } from "react-use";
// import NodeGraphPanelEditor from "../plugins/panel/nodeGraph/Editor";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import PanelStyles from "./PanelStyles";
import PanelSettings from "./PanelSettings";
import { useLeavePageConfirm } from "hooks/useLeavePage"
import { isEqual } from "lodash"
import { dispatch } from "use-bus"
import { PanelForceRebuildEvent } from "src/data/bus-events"
import AutoSizer from "react-virtualized-auto-sizer";
import { PanelGrid } from "../grid/PanelGrid"
import loadable from '@loadable/component'
import DatePicker from "components/DatePicker/DatePicker"
import PanelOverrides from "./PanelOverrides"

interface EditPanelProps {
    dashboard: Dashboard
    onChange: any
}

const EditPanel = ({ dashboard, onChange }: EditPanelProps) => {
    const edit = useSearchParam('edit')

    const [tempPanel, setTempPanel] = useImmer<Panel>(null)
    const [rawPanel, setRawPanel] = useState<Panel>(null)
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [hideDatasource, setHideDatasource] = useState(false)
    const [pageChanged, setPageChanged] = useState(false)

    useLeavePageConfirm(dashboard.data.enableUnsavePrompt ? pageChanged : false)

    useEffect(() => {
        if (edit) {
            const p = dashboard.data.panels.find(p => p.id.toString() === edit)
            if (p) {
                setTempPanel(p)
                onOpen()
            } else {
                onDiscard()
            }
        }
    }, [edit])

    useEffect(() => {
        if (!tempPanel) {
            // only discarding the current panel can get here
            return 
        }

        if (!rawPanel) {
            setRawPanel(tempPanel)
            return
        }

        const changed = !isEqual(rawPanel, tempPanel)
        setPageChanged(changed)
    }, [tempPanel])



    const onApplyChanges = () => {
        onChange(dashboard => {
            for (var i = 0; i < dashboard.data.panels.length; i++) {
                if (dashboard.data.panels[i].id === tempPanel.id) {
                    dashboard.data.panels[i] = tempPanel
                    break
                }
            }
        })

        if (pageChanged) {
            dispatch(PanelForceRebuildEvent + tempPanel.id)
        }

        setPageChanged(false)
        onEditClose()


    }


    const onDiscard = () => {
        setTempPanel(null)
        setPageChanged(false)
        onEditClose()
    }


    const onEditClose = () => {
        removeParamFromUrl(['edit'])
        setPageChanged(false)
        onClose()
    }

    const maxPanelHeight = () => {
        if (!tempPanel.plugins[tempPanel.type].disableDatasource) {
            if (hideDatasource) {
                return '100%'
            }
            return '50%'
        }
        return '100%'
    }

    const maxDatasourceHeight = () => {
        if (!tempPanel.plugins[tempPanel.type].disableDatasource) {
            if (hideDatasource) {
                return '0%'
            }
            return '50%'
        }
        return '0%'
    }

    return (<>
        <Modal isOpen={isOpen} onClose={onEditClose} autoFocus={false} size="full">
            <ModalOverlay />
            {dashboard && tempPanel && <ModalContent>
                {/* editor header section */}
                <ModalHeader>
                    <Flex justifyContent="space-between">
                        <Text>{dashboard.title} / Edit Panel</Text>
                        <HStack spacing={1}>
                            <DatePicker showTime/>
                            <ColorModeSwitcher />
                            <Button variant="outline" onClick={() => { onDiscard(), onClose() }} >Discard</Button>
                            <Button onClick={onApplyChanges}>Apply</Button>
                        </HStack>
                    </Flex>
                </ModalHeader>
                <ModalBody>
                    <HStack height="calc(100vh - 100px)" alignItems="top">
                        <Box width="65%" height="100%">
                            {/* panel rendering section */}
                            <Box key={tempPanel.id.toString() + hideDatasource as string} height={maxPanelHeight()} id="edit-panel-render" position="relative">
                                <AutoSizer>
                                    {({ width,height }) => {
                                        if (width === 0) {
                                            return null;
                                        }
                                        return <PanelGrid width={width} height={height} key={tempPanel.id + tempPanel.type} dashboard={dashboard} panel={tempPanel} sync={null}  />
                                    }}
                                </AutoSizer>
                                {!tempPanel.plugins[tempPanel.type].disableDatasource && <Box position="absolute" right="0" bottom={hideDatasource ? "0" : "-35px"} opacity="0.3" cursor="pointer" fontSize=".8rem" onClick={() => { setHideDatasource(!hideDatasource) }}>{hideDatasource ? <FaArrowUp /> : <FaArrowDown />}</Box>}
                            </Box>
                            {/* panel datasource section */}
                            {!tempPanel.plugins[tempPanel.type].disableDatasource && <Box maxHeight={maxDatasourceHeight()} mt="2" overflowY="scroll">
                                <EditPanelQuery key={tempPanel.id + tempPanel.type} panel={tempPanel} onChange={setTempPanel} />
                            </Box>}
                        </Box>
                        {/* panel settings section */}
                        <Box width="35%" maxHeight="100%" overflowY={"scroll"}>
                            <Box className="top-gradient-border bordered-left bordered-right" >
                                <Tabs position="relative" variant="unstyled">
                                    <TabList pb="0">
                                        <Tab>Panel</Tab>
                                        <Tab>Styles</Tab>
                                        <Tab>Overrides</Tab>
                                    </TabList>
                                    <TabIndicator
                                        mt="3px"
                                        height="2px"
                                        bg="brand.500"
                                        borderRadius="1px"
                                    />
                                    <TabPanels>
                                        <TabPanel px="0" pt="1">
                                            {/* panel basic setting */}
                                            <PanelSettings panel={tempPanel} onChange={setTempPanel} />

                                            {/* panel rendering plugin setting */}
                                            <CustomPanelEditor tempPanel={tempPanel} setTempPanel={setTempPanel} />
                                        </TabPanel>
                                        <TabPanel px="0" pt="1" pb="0">
                                            <PanelStyles panel={tempPanel} onChange={setTempPanel} />
                                        </TabPanel>
                                        <TabPanel px="0" pt="1" pb="0">
                                            <PanelOverrides panel={tempPanel} onChange={setTempPanel} />
                                        </TabPanel>
                                    </TabPanels>
                                </Tabs>

                            </Box>

                        </Box>
                    </HStack>
                </ModalBody>
            </ModalContent>}
        </Modal>
    </>)
}

export default EditPanel

//@needs-update-when-add-new-panel
const loadablePanels = {
    [PanelType.Text]: loadable(() => import('../plugins/panel/text/Editor')),
    [PanelType.Graph]: loadable(() => import('../plugins/panel/graph/Editor')),
    [PanelType.Table]: loadable(() => import('../plugins/panel/table/Editor')),
    [PanelType.NodeGraph]: loadable(() => import('../plugins/panel/nodeGraph/Editor')),
    [PanelType.Echarts]: loadable(() => import('../plugins/panel/echarts/Editor')),
    [PanelType.Pie]: loadable(() => import('../plugins/panel/pie/Editor')),
    [PanelType.Gauge]: loadable(() => import('../plugins/panel/gauge/Editor')),
    [PanelType.Stat]: loadable(() => import('../plugins/panel/stat/Editor')),
}



const CustomPanelEditor = ({ tempPanel, setTempPanel }) => {
    const Editor = loadablePanels[tempPanel.type]
    if (Editor) {
        return <Editor panel={tempPanel} onChange={setTempPanel} />
    }

    return null
}