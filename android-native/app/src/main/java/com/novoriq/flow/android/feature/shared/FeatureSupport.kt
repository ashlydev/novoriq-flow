package com.novoriq.flow.android.feature.shared

import androidx.compose.ui.graphics.Color
import com.novoriq.flow.android.core.designsystem.FlowError
import com.novoriq.flow.android.core.designsystem.FlowInfo
import com.novoriq.flow.android.core.designsystem.FlowSuccess
import com.novoriq.flow.android.core.designsystem.FlowWarning
import com.novoriq.flow.android.core.model.AlertLevel
import com.novoriq.flow.android.core.model.RecordStatus
import java.time.LocalDate
import java.time.format.DateTimeFormatter

private val dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy")

fun LocalDate.asFlowDate(): String = format(dateFormatter)

fun Double.asCurrency(currency: String = "USD"): String = "$currency ${"%,.2f".format(this)}"

fun RecordStatus.label(): String = when (this) {
    RecordStatus.Draft -> "Draft"
    RecordStatus.Sent -> "Sent"
    RecordStatus.PartiallyPaid -> "Partial"
    RecordStatus.Paid -> "Paid"
    RecordStatus.Overdue -> "Overdue"
    RecordStatus.Active -> "Active"
    RecordStatus.Archived -> "Archived"
}

fun RecordStatus.color(): Color = when (this) {
    RecordStatus.Draft -> FlowInfo
    RecordStatus.Sent -> FlowInfo
    RecordStatus.PartiallyPaid -> FlowWarning
    RecordStatus.Paid -> FlowSuccess
    RecordStatus.Overdue -> FlowError
    RecordStatus.Active -> FlowSuccess
    RecordStatus.Archived -> FlowWarning
}

fun AlertLevel.color(): Color = when (this) {
    AlertLevel.Info -> FlowInfo
    AlertLevel.Success -> FlowSuccess
    AlertLevel.Warning -> FlowWarning
    AlertLevel.Error -> FlowError
}
