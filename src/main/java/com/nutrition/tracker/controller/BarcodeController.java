package com.nutrition.tracker.controller;

import com.nutrition.tracker.dto.BarcodeLookupResponse;
import com.nutrition.tracker.service.BarcodeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/barcode")
public class BarcodeController {

    private final BarcodeService barcodeService;

    public BarcodeController(BarcodeService barcodeService) {
        this.barcodeService = barcodeService;
    }

    @GetMapping("/{barcode}")
    public ResponseEntity<BarcodeLookupResponse> lookupBarcode(@PathVariable String barcode) {
        BarcodeLookupResponse response = barcodeService.lookupBarcode(barcode);
        return ResponseEntity.ok(response);
    }
}
