package com.ixit.filenamequery;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.Toast;
import android.widget.CheckBox;
import android.widget.RadioGroup;
import android.widget.TextView;

import org.apache.cordova.*;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONException;

import android.content.Context;

/**
 * @author koded
 */
public class FileNameQuery extends CordovaPlugin {

    CallbackContext callback;

    @Override
    public boolean execute(String action, CordovaArgs args, CallbackContext callbackContext) throws JSONException {

          // Context context = cordova.getActivity().getApplicationContext();
          // Intent intent = new Intent(context, ru.bartwell.exfilepicker.ExFilePickerActivity.class);
            // chooseFile(callbackContext);
          String str = "Nothing h";
          callbackContext.success(str);
          return true;

    }
}